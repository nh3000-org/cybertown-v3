package main

import (
	"backend/db"
	t "backend/types"
	"backend/utils"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/lithammer/shortuuid/v4"
	"nhooyr.io/websocket"
	"nhooyr.io/websocket/wsjson"
)

type connParticipantMap map[*websocket.Conn]*t.Participant

type socketServer struct {
	conns  connParticipantMap
	rooms  map[int]map[*websocket.Conn]struct{}
	repo   *db.Repo
	emojis map[string]struct{}
}

func newSocketServer(repo *db.Repo, emojis map[string]struct{}) *socketServer {
	return &socketServer{
		conns:  make(connParticipantMap),
		rooms:  make(map[int]map[*websocket.Conn]struct{}),
		emojis: emojis,
		repo:   repo,
	}
}

func (s *socketServer) accept(conn *websocket.Conn, user *t.User) {
	p := &t.Participant{}
	if user != nil {
		p.Status = "None"
		p.User = *user
	}
	s.conns[conn] = p
}

func (s *socketServer) close(conn *websocket.Conn, roomID int, user *t.User) {
	delete(s.conns, conn)
	if !s.isInRoom(conn, roomID) {
		return
	}
	s.leaveRoom(conn, roomID, user)
}

func (s *socketServer) isInRoom(conn *websocket.Conn, roomID int) bool {
	if _, ok := s.rooms[roomID]; ok {
		_, ok := s.rooms[roomID][conn]
		return ok
	}
	return false
}

func (s *socketServer) getParticipantsFromIDs(roomID int, participantIDs []int) (map[int]*t.Participant, bool) {
	participants := make(map[int]*t.Participant)
	if _, ok := s.rooms[roomID]; ok {
		for conn := range s.rooms[roomID] {
			participant := s.conns[conn]
			if utils.Includes(participantIDs, participant.ID) {
				participants[participant.ID] = participant
			}
		}
	}
	return participants, len(participants) == len(participantIDs)
}

func (s *socketServer) joinRoom(conn *websocket.Conn, roomID int) {
	if _, ok := s.rooms[roomID]; !ok {
		s.rooms[roomID] = make(map[*websocket.Conn]struct{})
	}
	s.rooms[roomID][conn] = struct{}{}
}

func (s *socketServer) leaveRoom(conn *websocket.Conn, roomID int, user *t.User) {
	delete(s.rooms[roomID], conn)
	s.broadcastEvent(&t.Event{
		Name: "LEFT_ROOM_BROADCAST",
		Data: map[string]any{
			"roomID": roomID,
			"user":   user,
		},
	})
}

func (s *socketServer) broadcastEvent(event *t.Event) {
	for conn := range s.conns {
		utils.WriteEvent(conn, event)
	}
}

func (s *socketServer) broadcastRoomEvent(roomID int, participantIDs []int, event *t.Event) {
	conns, ok := s.rooms[roomID]
	if !ok {
		log.Printf("broadcast to room failed, room not found: %d", roomID)
		return
	}
	var sendCount int
	for conn := range conns {
		if participantIDs != nil {
			p := s.conns[conn]
			if utils.Includes(participantIDs, p.ID) {
				utils.WriteEvent(conn, event)
				sendCount++
			}
			if sendCount >= len(participantIDs) {
				break
			}
		} else {
			utils.WriteEvent(conn, event)
		}
	}
}

func (s *socketServer) getParticipantsInRoom(roomID int) []*t.Participant {
	participants := make([]*t.Participant, 0)
	if _, ok := s.rooms[roomID]; ok {
		for conn := range s.rooms[roomID] {
			if p, ok := s.conns[conn]; ok {
				participants = append(participants, p)
			}
		}
	}
	return participants
}

func (s *socketServer) joinRoomHandler(conn *websocket.Conn, b []byte, user *t.User) (int, error) {
	var data t.JoinRoom
	err := json.Unmarshal(b, &data)
	if err != nil {
		return 0, nil
	}

	_, err = s.repo.GetRoom(context.Background(), data.RoomID)
	if err != nil {
		return 0, err
	}

	// can the same user join the room from different
	// socket connections?
	s.joinRoom(conn, data.RoomID)

	s.broadcastEvent(&t.Event{
		Name: "JOINED_ROOM_BROADCAST",
		Data: map[string]any{
			"roomID": data.RoomID,
			"user":   user,
		},
	})

	return data.RoomID, nil
}

func (s *socketServer) leaveRoomHandler(conn *websocket.Conn, b []byte, user *t.User) {
	var data t.LeaveRoom
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal LEAVE_ROOM data: %v", err)
		return
	}
	if !s.isInRoom(conn, data.RoomID) {
		return
	}
	s.leaveRoom(conn, data.RoomID, user)
}

func (s *socketServer) newMessageHandler(conn *websocket.Conn, b []byte, user *t.User) {
	var data t.NewMessage
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal NEW_MESSAGE data: %v", err)
		return
	}

	ok, err := utils.ValidateContent(&data.Content)
	if !ok {
		log.Printf("message content validation failed: %v", err)
		return
	}

	p, ok := s.participantsInRoom(data.RoomID, user.ID, conn, data.ParticipantID)
	if !ok {
		log.Printf("participants not in room???")
		fmt.Println(data.RoomID, user.ID, *data.ParticipantID)
		return
	}

	d := map[string]any{
		"id":        shortuuid.New(),
		"content":   data.Content,
		"from":      user,
		"createdAt": time.Now().UTC().Format(time.RFC3339),
		"roomID":    data.RoomID,
		"reactions": make(map[string]any),
	}

	if data.ReplyTo != nil {
		d["replyTo"] = *data.ReplyTo
	}

	if data.ParticipantID != nil {
		d["participant"] = p[*data.ParticipantID]
	}

	s.broadcastRoomEvent(data.RoomID, utils.KeyOf(p), &t.Event{
		Name: "NEW_MESSAGE_BROADCAST",
		Data: d,
	})
}

func (s *socketServer) participantsInRoom(roomID, userID int, conn *websocket.Conn, participantID *int) (map[int]*t.Participant, bool) {
	var participants map[int]*t.Participant
	if participantID != nil {
		p, ok := s.getParticipantsFromIDs(roomID, []int{userID, *participantID})
		if !ok {
			return nil, false
		}
		participants = p
	} else if !s.isInRoom(conn, roomID) {
		return nil, false
	}
	return participants, true
}

func (s *socketServer) editMessageHandler(conn *websocket.Conn, b []byte, user *t.User) {
	var data t.EditMessage
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal EDIT_MESSAGE data: %v", err)
		return
	}

	ok, err := utils.ValidateContent(&data.Content)
	if !ok {
		log.Printf("message content validation failed: %v", err)
		return
	}

	p, ok := s.participantsInRoom(data.RoomID, user.ID, conn, data.ParticipantID)
	if !ok {
		return
	}

	s.broadcastRoomEvent(data.RoomID, utils.KeyOf(p), &t.Event{
		Name: "EDIT_MESSAGE_BROADCAST",
		Data: map[string]any{
			"id":      data.ID,
			"roomID":  data.RoomID,
			"content": data.Content,
			"from":    user,
		},
	})
}

func (s *socketServer) reactionToMsgHandler(conn *websocket.Conn, b []byte, user *t.User) {
	var data t.ReactionToMessage
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal REACTION_TO_MESSAGE data: %v", err)
		return
	}

	p, ok := s.participantsInRoom(data.RoomID, user.ID, conn, data.ParticipantID)
	if !ok {
		return
	}

	if _, ok := s.emojis[data.Reaction]; !ok {
		log.Printf("the emoji is not found: %q", data.Reaction)
		return
	}

	s.broadcastRoomEvent(data.RoomID, utils.KeyOf(p), &t.Event{
		Name: "REACTION_TO_MESSAGE_BROADCAST",
		Data: map[string]any{
			"id":       data.ID,
			"roomID":   data.RoomID,
			"reaction": data.Reaction,
			"from":     user,
		},
	})
}

func (s *socketServer) clearChatHandler(conn *websocket.Conn, b []byte, user *t.User) {
	var data t.ClearChat
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal CLEAR_CHAT data: %v", err)
		return
	}

	p, ok := s.getParticipantsFromIDs(data.RoomID, []int{user.ID, data.ParticipantID})
	if !ok {
		log.Printf("clear chat event: participants not in room")
		return
	}

	r, err := s.repo.GetRoomSettings(context.Background(), data.RoomID)
	if err != nil {
		log.Printf("clear chat event: failed to get room settings: %v", err)
		return
	}

	isHost := r.Host.ID == user.ID
	isCoHost := utils.Includes(r.CoHosts, user.ID)
	isParticipantHost := r.Host.ID == data.ParticipantID
	if (!isHost && !isCoHost) || isParticipantHost {
		log.Printf("clear chat event: permission denied")
		return
	}

	s.broadcastRoomEvent(data.RoomID, nil, &t.Event{
		Name: "CLEAR_CHAT_BROADCAST",
		Data: map[string]any{
			"roomID":      data.RoomID,
			"participant": p[data.ParticipantID].User,
			"by":          user,
		},
	})
}

func (s *socketServer) assignRoleHandler(conn *websocket.Conn, b []byte, user *t.User) {
	var data t.AssignRole
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal ASSIGN_ROLE data: %v", err)
		return
	}

	p, ok := s.getParticipantsFromIDs(data.RoomID, []int{user.ID, data.ParticipantID})
	if !ok {
		log.Printf("assign role event: participants not in room")
		return
	}

	r, err := s.repo.GetRoomSettings(context.Background(), data.RoomID)
	if !ok {
		log.Printf("assign role event: failed to get room settings: %v", err)
		return
	}
	isHost := r.Host.ID == user.ID
	isCoHost := utils.Includes(r.CoHosts, user.ID)
	isParticipantHost := r.Host.ID == data.ParticipantID

	if !isHost || isParticipantHost {
		log.Printf("assign role event: permission denied")
		return
	}

	filter := func(coHost int) bool {
		return coHost != data.ParticipantID
	}

	switch data.Role {
	case t.RoomRoleHost:
		if r.Host.ID == data.ParticipantID {
			log.Printf("assign role event: invalid payload")
			return
		}
		r.CoHosts = utils.Filter(r.CoHosts, filter)
		r.CoHosts = append(r.CoHosts, r.Host.ID)
		r.Host = t.User{
			ID: p[*&data.ParticipantID].ID,
		}
		welcomeMessage := ""
		r.WelcomeMessage = &welcomeMessage
	case t.RoomRoleGuest:
		if !isCoHost {
			log.Printf("assign role event: should be 'co-host' to assign role 'guest'")
			return
		}
		r.CoHosts = utils.Filter(r.CoHosts, filter)
	case t.RoomRoleCoHost:
		if isCoHost {
			log.Printf("assign role event: should be 'guest' to assign role 'co-host'")
			return
		}
		r.CoHosts = append(r.CoHosts, data.ParticipantID)
	}

	err = s.repo.UpdateRoomSettings(context.Background(), r)
	if err != nil {
		log.Printf("assign role event: failed to update room settings: %v", err)
		return
	}

	s.broadcastRoomEvent(data.RoomID, nil, &t.Event{
		Name: "ASSIGN_ROLE_BROADCAST",
		Data: map[string]any{
			"roomID":      data.RoomID,
			"by":          user,
			"role":        data.Role,
			"participant": p[data.ParticipantID].User,
		},
	})
}

func (s *socketServer) updateWelcomeMsgHandler(conn *websocket.Conn, b []byte, user *t.User) {
	var data t.UpdateWelcomeMessage
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal UPDATE_WELCOME_MESSAGE data: %v", err)
		return
	}

	if !s.isInRoom(conn, data.RoomID) {
		return
	}

	ok, err := utils.ValidateWelcomeMsg(&data.WelcomeMessage)
	if !ok {
		log.Printf("welcome message validation failed: %v", err)
		return
	}

	r, err := s.repo.GetRoomSettings(context.Background(), data.RoomID)
	if err != nil {
		log.Printf("update welcome message event: failed to get room settings: %v", err)
		return
	}

	isHost := r.Host.ID == user.ID
	isCoHost := utils.Includes(r.CoHosts, user.ID)
	if !isHost && !isCoHost {
		log.Printf("update welcome message event: permission denied")
		return
	}

	r.WelcomeMessage = &data.WelcomeMessage
	err = s.repo.UpdateRoomSettings(context.Background(), r)
	if err != nil {
		log.Printf("clear chat event: failed to update room settings: %v", err)
	}

	s.broadcastRoomEvent(data.RoomID, nil, &t.Event{
		Name: "UPDATE_WELCOME_MESSAGE_BROADCAST",
		Data: map[string]any{
			"by":             user,
			"welcomeMessage": data.WelcomeMessage,
			"roomID":         data.RoomID,
		},
	})
}

func (s *socketServer) setStatusHandler(conn *websocket.Conn, b []byte, user *t.User) {
	var data t.SetStatus
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal SET_STATUS data: %v", err)
		return
	}

	if !s.isInRoom(conn, data.RoomID) {
		return
	}

	ok, err := utils.ValidateStatus(&data.Status)
	if !ok {
		log.Printf("set status event: validation failed: %v", err)
		return
	}
	s.conns[conn].Status = data.Status

	s.broadcastRoomEvent(data.RoomID, nil, &t.Event{
		Name: "SET_STATUS_BROADCAST",
		Data: map[string]any{
			"roomID": data.RoomID,
			"status": data.Status,
			"by":     user,
		},
	})
}

func (s *socketServer) kickParticipantHandler(conn *websocket.Conn, b []byte, user *t.User) {
	var data t.KickParticipant
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal KICK_PARTICIPANT data: %v", err)
		return
	}

	duration, err := time.ParseDuration(data.Duration)
	if err != nil {
		log.Printf("kick participant event: invalid duration: %v", err)
		return
	}

	_, ok := s.getParticipantsFromIDs(data.RoomID, []int{user.ID, data.ParticipantID})
	if !ok {
		log.Printf("kick participant event: participants not in room")
		return
	}

	r, err := s.repo.GetRoomSettings(context.Background(), data.RoomID)
	if err != nil {
		log.Printf("kick participant event: failed to get room settings: %v", err)
		return
	}

	isHost := r.Host.ID == user.ID
	isCoHost := utils.Includes(r.CoHosts, user.ID)
	isParticipantHost := r.Host.ID == data.ParticipantID
	if (!isHost && !isCoHost) || isParticipantHost {
		log.Print("kick participant event: permission denied")
		return
	}

	_, err = s.repo.GetKick(context.Background(), data.RoomID, data.ParticipantID)
	if nil == err {
		log.Print("kick participant event: participant is kicked already")
		return
	}

	k := t.Kick{
		RoomID:   data.RoomID,
		Kicker:   user.ID,
		Kicked:   data.ParticipantID,
		Duration: int(duration.Seconds()),
	}
	err = s.repo.KickParticipant(context.Background(), &k)
	if err != nil {
		log.Print("kick participant event: failed to update in room_kicks: %v", err)
		return
	}

	// TODO: same user joining the room from different devices?
	for conn, participant := range s.conns {
		if participant.ID == data.ParticipantID {
			d := map[string]any{
				"by":          user,
				"participant": participant.User,
				"roomID":      data.RoomID,
			}
			if data.ClearChat {
				s.broadcastRoomEvent(data.RoomID, nil, &t.Event{
					Name: "CLEAR_CHAT_BROADCAST",
					Data: d,
				})
			}
			d["duration"] = k.Duration
			d["kickedAt"] = time.Now().UTC()
			s.broadcastRoomEvent(data.RoomID, nil, &t.Event{
				Name: "KICK_PARTICIPANT_BROADCAST",
				Data: d,
			})
			s.leaveRoom(conn, data.RoomID, &participant.User)
			break
		}
	}
}

func (s *socketServer) deleteMessageHandler(conn *websocket.Conn, b []byte, user *t.User) {
	var data t.DeleteMessage
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal DELETE_MESSAGE data: %v", err)
		return
	}

	p, ok := s.participantsInRoom(data.RoomID, user.ID, conn, data.ParticipantID)
	if !ok {
		return
	}

	s.broadcastRoomEvent(data.RoomID, utils.KeyOf(p), &t.Event{
		Name: "DELETE_MESSAGE_BROADCAST",
		Data: map[string]any{
			"id":     data.ID,
			"roomID": data.RoomID,
			"from":   user,
		},
	})
}

func (app *application) wsHandler(w http.ResponseWriter, r *http.Request) {
	host := strings.Split(app.conf.RedirectURL, "//")[1]
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		OriginPatterns: []string{host},
	})
	if err != nil {
		log.Printf("failed to accept socket connection: %v", err)
		return
	}

	// last joined room
	var roomID int

	user, ok := r.Context().Value("user").(*t.User)
	if !ok {
		user = nil
	}

	defer func() {
		app.ss.close(conn, roomID, user)
		conn.CloseNow()
		log.Printf("number of connections: %d", len(app.ss.conns))
	}()

	app.ss.accept(conn, user)

	for {
		var event t.Event
		err := wsjson.Read(context.Background(), conn, &event)
		if err != nil {
			log.Printf("failed to read message: %v", err)
			return
		}

		// only users who are authenticated can send event
		if user == nil {
			return
		}

		b, err := json.Marshal(event.Data)
		if err != nil {
			log.Printf("failed to marshal 'data' in event: %v", err)
			return
		}

		switch event.Name {
		case "JOIN_ROOM":
			roomID, err = app.ss.joinRoomHandler(conn, b, user)
			if err != nil {
				log.Printf("failed to join room: %v", err)
			}
		case "LEAVE_ROOM":
			app.ss.leaveRoomHandler(conn, b, user)
		case "NEW_MESSAGE":
			app.ss.newMessageHandler(conn, b, user)
		case "EDIT_MESSAGE":
			app.ss.editMessageHandler(conn, b, user)
		case "DELETE_MESSAGE":
			app.ss.deleteMessageHandler(conn, b, user)
		case "REACTION_TO_MESSAGE":
			app.ss.reactionToMsgHandler(conn, b, user)
		case "CLEAR_CHAT":
			app.ss.clearChatHandler(conn, b, user)
		case "ASSIGN_ROLE":
			app.ss.assignRoleHandler(conn, b, user)
		case "UPDATE_WELCOME_MESSAGE":
			app.ss.updateWelcomeMsgHandler(conn, b, user)
		case "SET_STATUS":
			app.ss.setStatusHandler(conn, b, user)
		case "KICK_PARTICIPANT":
			app.ss.kickParticipantHandler(conn, b, user)
		}
	}
}
