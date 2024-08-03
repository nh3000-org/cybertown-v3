package main

import (
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
	conns connUserMap
	rooms map[int]map[*websocket.Conn]struct{}
}

func newSocketServer() *socketServer {
	return &socketServer{
		conns: make(connUserMap),
		rooms: make(map[int]map[*websocket.Conn]struct{}),
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
	ss.leaveRoom(conn, roomID, user)
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
	ss.broadcastEvent(&t.Event{
		Name: "LEFT_ROOM",
		Data: map[string]any{
			"roomID": roomID,
			"user":   user,
		},
	})
}

func (s *socketServer) broadcastEvent(event *t.Event) {
	for conn := range ss.conns {
		utils.WriteEvent(conn, event)
	}
}

func (s *socketServer) broadcastRoomEvent(roomID int, event *t.Event) {
	conns, ok := ss.rooms[roomID]
	if !ok {
		log.Printf("broadcast to room failed, room not found: %d\n", roomID)
		return
	}
	for conn := range conns {
		utils.WriteEvent(conn, event)
	}

}

func (s *socketServer) getUsersInRoom(roomID int) []*t.User {
	users := make([]*t.User, 0)
	if _, ok := ss.rooms[roomID]; ok {
		for conn := range ss.rooms[roomID] {
			if u, ok := ss.conns[conn]; ok {
				users = append(users, u)
			}
		}
	}
	return users
}

func (s *socketServer) joinRoomHandler(conn *websocket.Conn, b []byte, user *t.User) (int, error) {
	var data t.JoinRoom
	err := json.Unmarshal(b, &data)
	if err != nil {
		return 0, nil
	}

	// can the same user join the room from different
	// socket connections?
	ss.joinRoom(conn, data.RoomID)

	ss.broadcastEvent(&t.Event{
		Name: "JOINED_ROOM",
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
		log.Printf("failed to unmarshal LEAVE_ROOM data: %v\n", err)
		return
	}
	if !ss.isInRoom(conn, data.RoomID) {
		return
	}
	ss.leaveRoom(conn, data.RoomID, user)
}

func (s *socketServer) newMessageHandler(conn *websocket.Conn, b []byte, user *t.User) {
	var data t.NewMessage
	err := json.Unmarshal(b, &data)
	if err != nil {
		log.Printf("failed to unmarshal NEW_MESSAGE data: %v\n", err)
		return
	}

	// can this user send a message to this room?
	// is the message is valid?
	if !ss.isInRoom(conn, data.RoomID) {
		return
	}

	ss.broadcastRoomEvent(data.RoomID, &t.Event{
		Name: "NEW_MESSAGE_BROADCAST",
		Data: map[string]any{
			"id":        shortuuid.New(),
			"message":   data.Message,
			"from":      user,
			"createdAt": time.Now().UTC().Format(time.RFC3339),
		},
	})
}

var ss = newSocketServer()

func (app *application) wsHandler(w http.ResponseWriter, r *http.Request) {
	host := strings.Split(app.conf.RedirectURL, "//")[1]
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		OriginPatterns: []string{host},
	})
	if err != nil {
		log.Printf("failed to accept socket connection: %v", err)
		return
	}
	log.Println("connection established")

	// last joined room
	var roomID int

	user, ok := r.Context().Value("user").(*t.User)
	if !ok {
		user = nil
	}

	defer func() {
		ss.close(conn, roomID, user)
		conn.CloseNow()
		log.Printf("number of connections: %d\n", len(ss.conns))
	}()

	ss.accept(conn, user)

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
			log.Printf("failed to marshal 'data' in event: %v\n", err)
			return
		}

		switch event.Name {
		case "JOIN_ROOM":
			roomID, err = ss.joinRoomHandler(conn, b, user)
			if err != nil {
				log.Printf("failed to join room: %v\n", err)
			}
		case "NEW_MESSAGE":
			ss.newMessageHandler(conn, b, user)
		case "LEAVE_ROOM":
			ss.leaveRoomHandler(conn, b, user)
		}
	}
}
