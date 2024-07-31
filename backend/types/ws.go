package types

type Event struct {
	Name string         `json:"name"`
	Data map[string]any `json:"data"`
}

type JoinRoom struct {
	RoomID int `json:"roomID"`
}

type NewMessage struct {
	RoomID  int    `json:"roomID"`
	Message string `json:"message"`
}
