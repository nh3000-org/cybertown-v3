package cybertown

import "time"

type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Avatar   string `json:"avatar"`
}

type Room struct {
	ID        int       `json:"id"`
	Topic     int       `json:"topic"`
	CreatedAt time.Time `json:"createdAt"`
}

type RoomSettings struct {
	Host           int     `json:"host"`
	CoHosts        []int   `json:"coHosts"`
	WelcomeMessage *string `json:"welcomeMessage,omitempty"`
}

type Message struct {
	ID        string          `json:"id"`
	Content   string          `json:"content"`
	IsDeleted bool            `json:"isDeleted"`
	IsEdited  bool            `json:"isEdited"`
	CreatedAt time.Time       `json:"createdAt"`
	ReplyTo   *string         `json:"replyTo,omitempty"`
	Reactions *map[string]any `json:"reactions,omitempty"`
}
