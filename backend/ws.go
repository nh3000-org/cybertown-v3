package main

import (
	"backend/types"
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

type socketServer struct {
	conns       map[*websocket.Conn]struct{}
	connUserMap map[*websocket.Conn]*types.User
	rooms       map[int]map[*websocket.Conn]struct{}
}

func (s *socketServer) accept(conn *websocket.Conn, user *types.User) {
	s.conns[conn] = struct{}{}
	s.connUserMap[conn] = user
}

func (s *socketServer) close(conn *websocket.Conn, roomID int, user *types.User) {
	delete(s.conns, conn)
	delete(s.connUserMap, conn)

	if _, ok := s.rooms[roomID]; ok {
		delete(s.rooms[roomID], conn)

		if user == nil {
			return
		}

		for conn := range ss.conns {
			utils.WriteEvent(conn, &types.Event{
				Name: "LEFT_ROOM",
				Data: map[string]any{
					"roomID": roomID,
					"user":   user,
				},
			})
		}
	}
}

func (s *socketServer) isInRoom(roomID int, conn *websocket.Conn) bool {
	if _, ok := s.rooms[roomID]; ok {
		_, ok := s.rooms[roomID][conn]
		return ok
	}
	return false
}

func (s *socketServer) joinRoom(roomID int, conn *websocket.Conn) {
	if _, ok := s.rooms[roomID]; !ok {
		s.rooms[roomID] = make(map[*websocket.Conn]struct{})
	}
	s.rooms[roomID][conn] = struct{}{}
}

func newSocketServer() *socketServer {
	return &socketServer{
		conns:       make(map[*websocket.Conn]struct{}),
		connUserMap: make(map[*websocket.Conn]*types.User),
		rooms:       make(map[int]map[*websocket.Conn]struct{}),
	}
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

	user, ok := r.Context().Value("user").(*types.User)
	if !ok {
		user = nil
	}

	// last joined room
	var roomID int

	defer func() {
		ss.close(conn, roomID, user)
		conn.CloseNow()
		log.Printf("number of connections: %d\n", len(ss.conns))
	}()

	log.Println("connection established")
	ss.accept(conn, user)

	for {
		var event types.Event
		err := wsjson.Read(context.Background(), conn, &event)
		if err != nil {
			log.Printf("failed to read message: %v", err)
			return
		}

		b, err := json.Marshal(event.Data)
		if err != nil {
			log.Printf("failed to marshal 'data' in event: %v\n", err)
			return
		}

		// learn how generics in golang to make this better
		switch event.Name {
		case "JOIN_ROOM":
			var data types.JoinRoom
			err := json.Unmarshal(b, &data)
			if err != nil {
				log.Printf("failed to unmarshal JOIN_ROOM data: %v\n", err)
				return
			}

			// is the user allowed to join?
			if _, ok := ss.connUserMap[conn]; !ok {
				log.Println("you need to be authenticated to join room")
				return
			}

			// is this a valid room? and the user is allowed to join?
			ss.joinRoom(data.RoomID, conn)
			roomID = data.RoomID

			for conn := range ss.conns {
				utils.WriteEvent(conn, &types.Event{
					Name: "JOINED_ROOM",
					Data: map[string]any{
						"roomID": data.RoomID,
						"user":   user,
					},
				})
			}
		case "NEW_MESSAGE":
			var data types.NewMessage
			err := json.Unmarshal(b, &data)
			if err != nil {
				log.Printf("failed to unmarshal NEW_MESSAGE data: %v\n", err)
				return
			}

			// can this user send a message to this room?
			// is the message is valid?
			if !ss.isInRoom(data.RoomID, conn) {
				return
			}

			for conn := range ss.rooms[data.RoomID] {
				utils.WriteEvent(conn, &types.Event{
					Name: "NEW_MESSAGE_BROADCAST",
					Data: map[string]any{
						"id":        shortuuid.New(),
						"message":   data.Message,
						"from":      user,
						"createdAt": time.Now().UTC().Format(time.RFC3339),
					},
				})
			}
		}
	}
}
