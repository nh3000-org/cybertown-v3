package utils

import (
	"backend/types"
	v "backend/validator"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"nhooyr.io/websocket"
	"nhooyr.io/websocket/wsjson"
)

const (
	minMsgContentLen = 1
	maxMsgContentLen = 1024
	maxWelcomeMsgLen = 512
)

func WriteEvent(conn *websocket.Conn, event *types.Event) {
	err := wsjson.Write(context.Background(), conn, event)
	if err != nil {
		log.Printf("failed to send %q event: %v\n", event.Name, err)
	}
}

func ValidateContent(content *string) (bool, error) {
	vd := v.NewValidator().
		Count("content", content, "min", minMsgContentLen).
		Count("content", content, "max", maxMsgContentLen)
	return vd.IsValid(), vd
}

func ValidateWelcomeMsg(welcomeMsg *string) (bool, error) {
	vd := v.NewValidator().
		Count("welcomeMessage", welcomeMsg, "max", maxWelcomeMsgLen)
	return vd.IsValid(), vd
}

func GetEmojis() (map[string]struct{}, error) {
	url := "https://cdn.jsdelivr.net/npm/@emoji-mart/data"
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("received status code %d for url %q", resp.StatusCode, url)
	}

	var data struct {
		Categories []struct {
			Emojis []string `json:"emojis"`
		} `json:"categories"`
	}

	err = json.NewDecoder(resp.Body).Decode(&data)
	if err != nil {
		return nil, err
	}

	var emojis = map[string]struct{}{}
	for _, category := range data.Categories {
		for _, emoji := range category.Emojis {
			emojis[emoji] = struct{}{}
		}
	}

	return emojis, nil
}
