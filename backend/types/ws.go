package types

type Event struct {
	Name string         `json:"name"`
	Data map[string]any `json:"data"`
}

type JoinRoom struct {
	RoomID int `json:"roomID"`
}

type LeaveRoom struct {
	RoomID int `json:"roomID"`
}

type NewMessage struct {
	RoomID  int    `json:"roomID"`
	Message string `json:"message"`
	ReplyTo string `json:"replyTo"`
}

type EditMessage struct {
	ID      string `json:"id"`
	RoomID  int    `json:"roomID"`
	Message string `json:"message"`
}

type DeleteMessage struct {
	ID     string `json:"id"`
	RoomID int    `json:"roomID"`
}

type ReactionToMessage struct {
	ID       string `json:"id"`
	Reaction string `json:"reaction"`
	RoomID   int    `json:"roomID"`
}
