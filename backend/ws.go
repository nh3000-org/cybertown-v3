package main

import (
	"backend/db"
	"backend/service"
	t "backend/types"
	"backend/utils"
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/lithammer/shortuuid/v4"
	"nhooyr.io/websocket"
	"nhooyr.io/websocket/wsjson"
)

type socketServer struct {
	conns        map[*websocket.Conn]int
	participants map[int]*t.Participant
	rooms        map[int]map[*websocket.Conn]struct{}
	repo         *db.Repo
	emojis       map[string]struct{}
	svc          *service.Service
}

func newSocketServer(repo *db.Repo, svc *service.Service, emojis map[string]struct{}) *socketServer {
	return &socketServer{
		conns:        make(map[*websocket.Conn]int),
		rooms:        make(map[int]map[*websocket.Conn]struct{}),
		participants: make(map[int]*t.Participant),
		emojis:       emojis,
		repo:         repo,
		svc:          svc,
	}
}

func (s *socketServer) accept(conn *websocket.Conn, user *t.User) {
	p := &t.Participant{}
	if user != nil {
		p.Status = "None"
		p.User = *user
	}
	s.participants[p.ID] = p
	s.conns[conn] = p.ID
}

func (s *socketServer) close(conn *websocket.Conn, roomID int, user *t.User) {
	delete(s.conns, conn)
	if !s.isInRoom(conn, roomID) {
		return
	}
	s.leaveRoom(conn, user, roomID)
}

func (s *socketServer) isInRoom(conn *websocket.Conn, roomID int) bool {
	if _, ok := s.rooms[roomID]; ok {
		_, ok := s.rooms[roomID][conn]
		return ok
	}
	return false
}

func (s *socketServer) joinRoom(conn *websocket.Conn, roomID int) {
	if _, ok := s.rooms[roomID]; !ok {
		s.rooms[roomID] = make(map[*websocket.Conn]struct{})
	}
	s.rooms[roomID][conn] = struct{}{}
	s.broadcastEvent(&t.Event{
		Name: "JOINED_ROOM_BROADCAST",
		Data: map[string]any{
			"roomID": roomID,
			"user":   s.participants[s.conns[conn]].User,
		},
	})
}

func (s *socketServer) leaveRoom(conn *websocket.Conn, user *t.User, roomID int) {
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

func (s *socketServer) broadcastMsgEvent(pIDs []int, event *t.Event) {
	for conn, pID := range s.conns {
		if utils.Includes(pIDs, pID) {
			utils.WriteEvent(conn, event)
		}
	}
}

func (s *socketServer) broadcastRoomEvent(roomID int, event *t.Event) {
	conns, ok := s.rooms[roomID]
	if !ok {
		log.Printf("broadcast to room failed, room not found: %d", roomID)
		return
	}

	for conn := range conns {
		utils.WriteEvent(conn, event)
	}
}

func (s *socketServer) getParticipantsInRoom(roomID int) []*t.Participant {
	participants := make([]*t.Participant, 0)
	if _, ok := s.rooms[roomID]; ok {
		for conn := range s.rooms[roomID] {
			if pID, ok := s.conns[conn]; ok {
				participants = append(participants, s.participants[pID])
			}
		}
	}
	return participants
}

func (s *socketServer) joinRoomHandler(conn *websocket.Conn, b []byte) (int, error) {
	var data t.JoinRoom
	err := json.Unmarshal(b, &data)
	if err != nil {
		return 0, nil
	}

	r, err := s.repo.GetRoom(context.Background(), data.RoomID)
	if err != nil {
		return 0, err
	}

	if len(s.rooms[data.RoomID]) >= r.MaxParticipants {
		return 0, errors.New("max participants limit reached")
	}

	s.joinRoom(conn, data.RoomID)

	return data.RoomID, nil
}

func (s *socketServer) leaveRoomHandler(conn *websocket.Conn, b []byte) {
	var data t.LeaveRoom
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal LEAVE_ROOM data: %v", err)
		return
	}
	if !s.isInRoom(conn, data.RoomID) {
		return
	}
	user := s.participants[s.conns[conn]].User
	s.leaveRoom(conn, &user, data.RoomID)
}

func (s *socketServer) newMessageHandler(conn *websocket.Conn, b []byte) {
	var data t.NewMessage
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal NEW_MESSAGE data: %v", err)
		return
	}

	msgType := utils.GetMsgType(data.RoomID, data.ParticipantID)
	if msgType == t.UnknowMsg {
		log.Printf("new message event: unknow msg type")
		return
	}

	ok, err := utils.ValidateContent(&data.Content)
	if !ok {
		log.Printf("message content validation failed: %v", err)
		return
	}

	if msgType == t.RoomMsg || msgType == t.PrivateRoomMsg {
		ok = s.participantsInRoom(conn, *data.RoomID, data.ParticipantID)
		if !ok {
			return
		}
	}

	var (
		user      = s.participants[s.conns[conn]].User
		reactions = make(map[string]any)
	)

	msg := t.Message{
		ID:        shortuuid.New(),
		Content:   data.Content,
		From:      user,
		CreatedAt: time.Now().UTC(),
		Reactions: &reactions,
		ReplyTo:   data.ReplyTo,
	}

	if msgType == t.RoomMsg || msgType == t.PrivateRoomMsg {
		msg.RoomID = data.RoomID
	}

	if msgType == t.PrivateRoomMsg {
		msg.Participant = &s.participants[*data.ParticipantID].User
	}

	if msgType == t.DMMsg {
		msg.Participant = &t.User{
			ID: *data.ParticipantID,
		}
	}

	if msgType == t.DMMsg {
		dmID, err := s.svc.GetDM(context.Background(), user.ID, *data.ParticipantID)
		if err != nil {
			log.Printf("new message event: failed to get dm: %v", err)
			return
		}
		err = s.repo.CreateMessage(context.Background(), dmID, &msg)
		if err != nil {
			log.Printf("new message event: failed to create message: %v", err)
			return
		}
	}

	event := &t.Event{
		Name: "NEW_MESSAGE_BROADCAST",
		Data: msg,
	}
	if msgType == t.RoomMsg {
		s.broadcastRoomEvent(*data.RoomID, event)
	} else {
		pIDs := []int{user.ID, *data.ParticipantID}
		s.broadcastMsgEvent(pIDs, event)
	}
}

func (s *socketServer) participantsInRoom(conn *websocket.Conn, roomID int, participantID *int) bool {
	if !s.isInRoom(conn, roomID) {
		return false
	}
	if participantID == nil {
		return true
	}
	room, ok := s.rooms[roomID]
	if !ok {
		return false
	}
	for conn := range room {
		if s.conns[conn] == *participantID {
			return true
		}
	}
	return false

}

func (s *socketServer) editMessageHandler(conn *websocket.Conn, b []byte) {
	var data t.EditMessage
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal EDIT_MESSAGE data: %v", err)
		return
	}

	msgType := utils.GetMsgType(data.RoomID, data.ParticipantID)
	if msgType == t.UnknowMsg {
		log.Printf("edit message event: unknow msg type")
		return
	}

	ok, err := utils.ValidateContent(&data.Content)
	if !ok {
		log.Printf("edit message event: message content validation failed: %v", err)
		return
	}

	if msgType == t.RoomMsg || msgType == t.PrivateRoomMsg {
		ok = s.participantsInRoom(conn, *data.RoomID, data.ParticipantID)
		if !ok {
			return
		}
	}

	user := s.participants[s.conns[conn]].User

	if msgType == t.DMMsg {
		ctx := context.Background()

		dmID, err := s.svc.GetDM(ctx, user.ID, *data.ParticipantID)
		if err != nil {
			log.Printf("edit message event: failed to get dm: %v", err)
			return
		}

		m, err := s.repo.GetMessage(ctx, dmID, data.ID, user.ID, false)
		if err != nil {
			log.Printf("edit message event: failed to get message: %v", err)
			return
		}

		m.IsEdited = true
		m.Content = data.Content

		err = s.repo.UpdateMessage(ctx, dmID, m, false)
		if err != nil {
			log.Printf("edit message event: failed to update message: %v", err)
			return
		}
	}

	d := map[string]any{
		"id":      data.ID,
		"content": data.Content,
		"from":    user,
	}
	event := t.Event{
		Name: "EDIT_MESSAGE_BROADCAST",
		Data: d,
	}
	if msgType == t.RoomMsg || msgType == t.PrivateRoomMsg {
		d["roomID"] = *data.RoomID
	}
	if msgType == t.DMMsg {
		d["participant"] = map[string]any{
			"id": *data.ParticipantID,
		}
	}
	if msgType == t.RoomMsg {
		s.broadcastRoomEvent(*data.RoomID, &event)
	} else {
		pIDs := []int{user.ID, *data.ParticipantID}
		s.broadcastMsgEvent(pIDs, &event)
	}
}

func (s *socketServer) reactionToMsgHandler(conn *websocket.Conn, b []byte) {
	var data t.ReactionToMessage
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal REACTION_TO_MESSAGE data: %v", err)
		return
	}

	msgType := utils.GetMsgType(data.RoomID, data.ParticipantID)
	if msgType == t.UnknowMsg {
		log.Printf("reaction msg event: unknown msg type")
		return
	}

	if msgType == t.RoomMsg || msgType == t.PrivateRoomMsg {
		ok := s.participantsInRoom(conn, *data.RoomID, data.ParticipantID)
		if !ok {
			return
		}
	}

	if _, ok := s.emojis[data.Reaction]; !ok {
		log.Printf("the emoji is not found: %q", data.Reaction)
		return
	}

	d := map[string]any{
		"id":       data.ID,
		"roomID":   data.RoomID,
		"reaction": data.Reaction,
		"from":     s.participants[s.conns[conn]].User,
	}
	event := t.Event{
		Name: "REACTION_TO_MESSAGE_BROADCAST",
		Data: d,
	}

	if msgType == t.RoomMsg || msgType == t.PrivateRoomMsg {
		d["roomID"] = data.RoomID
	}
	if msgType == t.RoomMsg || msgType == t.PrivateRoomMsg {
		s.broadcastRoomEvent(*data.RoomID, &event)
	}
	// TODO: handle dms
}

func (s *socketServer) clearChatHandler(conn *websocket.Conn, b []byte) {
	var data t.ClearChat
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal CLEAR_CHAT data: %v", err)
		return
	}

	ok := s.participantsInRoom(conn, data.RoomID, &data.ParticipantID)
	if !ok {
		log.Printf("clear chat event: participants not in room")
		return
	}

	r, err := s.repo.GetRoomSettings(context.Background(), data.RoomID)
	if err != nil {
		log.Printf("clear chat event: failed to get room settings: %v", err)
		return
	}

	user := s.participants[s.conns[conn]].User
	isHost := r.Host.ID == user.ID
	isCoHost := utils.Includes(r.CoHosts, user.ID)
	isParticipantHost := r.Host.ID == data.ParticipantID
	if (!isHost && !isCoHost) || isParticipantHost {
		log.Printf("clear chat event: permission denied")
		return
	}

	s.broadcastRoomEvent(data.RoomID, &t.Event{
		Name: "CLEAR_CHAT_BROADCAST",
		Data: map[string]any{
			"roomID":      data.RoomID,
			"participant": s.participants[s.conns[conn]].User,
			"by":          user,
		},
	})
}

func (s *socketServer) assignRoleHandler(conn *websocket.Conn, b []byte) {
	var data t.AssignRole
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal ASSIGN_ROLE data: %v", err)
		return
	}

	ok := s.participantsInRoom(conn, data.RoomID, &data.ParticipantID)
	if !ok {
		log.Printf("assign role event: participants not in room")
		return
	}

	r, err := s.repo.GetRoomSettings(context.Background(), data.RoomID)
	if !ok {
		log.Printf("assign role event: failed to get room settings: %v", err)
		return
	}

	user := s.participants[s.conns[conn]].User
	isHost := r.Host.ID == user.ID
	isParticipantCoHost := utils.Includes(r.CoHosts, data.ParticipantID)
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
		r.CoHosts = utils.Filter(r.CoHosts, filter)
		r.CoHosts = append(r.CoHosts, r.Host.ID)
		r.Host = t.User{
			ID: data.ParticipantID,
		}
		welcomeMessage := ""
		r.WelcomeMessage = &welcomeMessage
	case t.RoomRoleGuest:
		if !isParticipantCoHost {
			log.Printf("assign role event: should be 'co-host' to assign role 'guest'")
			return
		}
		r.CoHosts = utils.Filter(r.CoHosts, filter)
	case t.RoomRoleCoHost:
		if isParticipantCoHost {
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

	s.broadcastRoomEvent(data.RoomID, &t.Event{
		Name: "ASSIGN_ROLE_BROADCAST",
		Data: map[string]any{
			"roomID":      data.RoomID,
			"by":          user,
			"role":        data.Role,
			"participant": s.participants[data.ParticipantID].User,
		},
	})
}

func (s *socketServer) updateWelcomeMsgHandler(conn *websocket.Conn, b []byte) {
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

	user := s.participants[s.conns[conn]]
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

	s.broadcastRoomEvent(data.RoomID, &t.Event{
		Name: "UPDATE_WELCOME_MESSAGE_BROADCAST",
		Data: map[string]any{
			"by":             user,
			"welcomeMessage": data.WelcomeMessage,
			"roomID":         data.RoomID,
		},
	})
}

func (s *socketServer) setStatusHandler(conn *websocket.Conn, b []byte) {
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
	s.participants[s.conns[conn]].Status = data.Status

	s.broadcastRoomEvent(data.RoomID, &t.Event{
		Name: "SET_STATUS_BROADCAST",
		Data: map[string]any{
			"roomID": data.RoomID,
			"status": data.Status,
			"by":     s.participants[s.conns[conn]].User,
		},
	})
}

func (s *socketServer) kickParticipantHandler(conn *websocket.Conn, b []byte) {
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
	if duration.Seconds() <= 0 {
		log.Printf("kick participant event: non-positive duration")
		return
	}

	ok := s.participantsInRoom(conn, data.RoomID, &data.ParticipantID)
	if !ok {
		log.Printf("kick participant event: participants not in room")
		return
	}

	r, err := s.repo.GetRoomSettings(context.Background(), data.RoomID)
	if err != nil {
		log.Printf("kick participant event: failed to get room settings: %v", err)
		return
	}

	user := s.participants[s.conns[conn]].User
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
		RoomID:    data.RoomID,
		UserID:    data.ParticipantID,
		ExpiredAt: time.Now().UTC().Add(duration),
	}

	if !utils.Includes(r.CoHosts, data.ParticipantID) {
		err = s.repo.KickParticipant(context.Background(), &k)
		if err != nil {
			log.Print("kick participant event: failed to update in room_kicks: %v", err)
			return
		}
	}

	d := map[string]any{
		"by":          user,
		"participant": s.participants[data.ParticipantID].User,
		"roomID":      data.RoomID,
	}
	if data.ClearChat {
		s.broadcastRoomEvent(data.RoomID, &t.Event{
			Name: "CLEAR_CHAT_BROADCAST",
			Data: d,
		})
	}
	d["expiredAt"] = k.ExpiredAt
	s.broadcastRoomEvent(data.RoomID, &t.Event{
		Name: "KICK_PARTICIPANT_BROADCAST",
		Data: d,
	})
	for conn, pID := range s.conns {
		if pID == data.ParticipantID {
			s.leaveRoom(conn, &s.participants[pID].User, data.RoomID)
		}
	}
}

func (s *socketServer) deleteMessageHandler(conn *websocket.Conn, b []byte) {
	var data t.DeleteMessage
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal DELETE_MESSAGE data: %v", err)
		return
	}

	msgType := utils.GetMsgType(data.RoomID, data.ParticipantID)
	if msgType == t.UnknowMsg {
		log.Printf("delete msg event: unknown msg type")
		return
	}

	if msgType == t.RoomMsg || msgType == t.PrivateRoomMsg {
		ok := s.participantsInRoom(conn, *data.RoomID, data.ParticipantID)
		if !ok {
			return
		}
	}

	u := s.participants[s.conns[conn]].User
	if msgType == t.DMMsg {
		ctx := context.Background()
		dmID, err := s.repo.GetDM(ctx, u.ID, *data.ParticipantID)
		if err != nil {
			log.Printf("delete msg event: failed to get dm: %v", err)
			return
		}
		m, err := s.repo.GetMessage(ctx, dmID, data.ID, u.ID, false)
		if err != nil {
			log.Printf("delete msg event: failed to get message: %v", err)
			return
		}
		m.IsDeleted = true
		m.Content = ""
		err = s.repo.UpdateMessage(ctx, dmID, m, false)
		if err != nil {
			log.Printf("delete msg event: failed to update message: %v", err)
			return
		}
	}

	d := map[string]any{
		"id":   data.ID,
		"from": u,
	}
	event := t.Event{
		Name: "DELETE_MESSAGE_BROADCAST",
		Data: d,
	}
	if msgType == t.RoomMsg || msgType == t.PrivateRoomMsg {
		d["roomID"] = *data.RoomID
	}
	if msgType == t.DMMsg {
		d["participant"] = map[string]any{
			"id": *data.ParticipantID,
		}
	}
	if msgType == t.RoomMsg {
		s.broadcastRoomEvent(*data.RoomID, &event)
	} else {
		pIDs := []int{u.ID, *data.ParticipantID}
		s.broadcastMsgEvent(pIDs, &event)
	}
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
	}()

	app.ss.accept(conn, user)

	for {
		var event t.Event
		err := wsjson.Read(context.Background(), conn, &event)
		if err != nil {
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
			roomID, err = app.ss.joinRoomHandler(conn, b)
			if err != nil {
				log.Printf("failed to join room: %v", err)
			}
		case "LEAVE_ROOM":
			app.ss.leaveRoomHandler(conn, b)
		case "NEW_MESSAGE":
			app.ss.newMessageHandler(conn, b)
		case "EDIT_MESSAGE":
			app.ss.editMessageHandler(conn, b)
		case "DELETE_MESSAGE":
			app.ss.deleteMessageHandler(conn, b)
		case "REACTION_TO_MESSAGE":
			app.ss.reactionToMsgHandler(conn, b)
		case "CLEAR_CHAT":
			app.ss.clearChatHandler(conn, b)
		case "ASSIGN_ROLE":
			app.ss.assignRoleHandler(conn, b)
		case "UPDATE_WELCOME_MESSAGE":
			app.ss.updateWelcomeMsgHandler(conn, b)
		case "SET_STATUS":
			app.ss.setStatusHandler(conn, b)
		case "KICK_PARTICIPANT":
			app.ss.kickParticipantHandler(conn, b)
		}
	}
}
