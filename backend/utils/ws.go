package utils

import (
	"backend/types"
	"context"
	"log"

	"nhooyr.io/websocket"
	"nhooyr.io/websocket/wsjson"
)

func WriteEvent(conn *websocket.Conn, event *types.Event) {
	err := wsjson.Write(context.Background(), conn, event)
	if err != nil {
		log.Printf("failed to send %q event: %v\n", event.Name, err)
	}
}
