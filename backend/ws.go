package main

import (
	"backend/db"
	t "backend/types"
	"backend/utils"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/lithammer/shortuuid/v4"
	"nhooyr.io/websocket"
	"nhooyr.io/websocket/wsjson"
)

type connUserMap map[*websocket.Conn]*t.User

type socketServer struct {
	conns  connUserMap
	rooms  map[int]map[*websocket.Conn]struct{}
	repo   *db.Repo
	emojis map[string]struct{}
}

func newSocketServer(repo *db.Repo, emojis map[string]struct{}) *socketServer {
	return &socketServer{
		conns:  make(connUserMap),
		rooms:  make(map[int]map[*websocket.Conn]struct{}),
		emojis: emojis,
		repo:   repo,
	}
}

func (s *socketServer) accept(conn *websocket.Conn, user *t.User) {
	s.conns[conn] = user
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

func (s *socketServer) getParticipantsInRoom(roomID int) []*t.User {
	participants := make([]*t.User, 0)
	if _, ok := s.rooms[roomID]; ok {
		for conn := range s.rooms[roomID] {
			if u, ok := s.conns[conn]; ok {
				participants = append(participants, u)
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

	// can this user send a message to this room?
	if !s.isInRoom(conn, data.RoomID) {
		return
	}

	s.broadcastRoomEvent(data.RoomID, &t.Event{
		Name: "NEW_MESSAGE_BROADCAST",
		Data: map[string]any{
			"id":        shortuuid.New(),
			"content":   data.Content,
			"from":      user,
			"createdAt": time.Now().UTC().Format(time.RFC3339),
			"roomID":    data.RoomID,
			"replyTo":   data.ReplyTo,
			"reactions": map[string]any{},
		},
	})
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

	if !s.isInRoom(conn, data.RoomID) {
		return
	}

	s.broadcastRoomEvent(data.RoomID, &t.Event{
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

	if !s.isInRoom(conn, data.RoomID) {
		return
	}

	if _, ok := s.emojis[data.Reaction]; !ok {
		log.Printf("the emoji is not found: %q", data.Reaction)
		return
	}

	s.broadcastRoomEvent(data.RoomID, &t.Event{
		Name: "REACTION_TO_MESSAGE_BROADCAST",
		Data: map[string]any{
			"id":       data.ID,
			"roomID":   data.RoomID,
			"reaction": data.Reaction,
			"from":     user,
		},
	})
}

func (s *socketServer) deleteMessageHandler(conn *websocket.Conn, b []byte, user *t.User) {
	var data t.DeleteMessage
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal DELETE_MESSAGE data: %v", err)
		return
	}

	if !s.isInRoom(conn, data.RoomID) {
		return
	}

	s.broadcastRoomEvent(data.RoomID, &t.Event{
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
		case "NEW_MESSAGE":
			app.ss.newMessageHandler(conn, b, user)
		case "EDIT_MESSAGE":
			app.ss.editMessageHandler(conn, b, user)
		case "DELETE_MESSAGE":
			app.ss.deleteMessageHandler(conn, b, user)
		case "LEAVE_ROOM":
			app.ss.leaveRoomHandler(conn, b, user)
		case "REACTION_TO_MESSAGE":
			app.ss.reactionToMsgHandler(conn, b, user)
		}
	}
}
