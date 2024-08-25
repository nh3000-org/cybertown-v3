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
	RoomID        int     `json:"roomID"`
	Content       string  `json:"content"`
	ReplyTo       *string `json:"replyTo"`
	ParticipantID *int    `json:"participantID"`
}

type EditMessage struct {
	ID            string `json:"id"`
	Content       string `json:"content"`
	RoomID        int    `json:"roomID"`
	ParticipantID *int   `json:"participantID"`
}

type DeleteMessage struct {
	ID            string `json:"id"`
	RoomID        int    `json:"roomID"`
	ParticipantID *int   `json:"participantID"`
}

type ReactionToMessage struct {
	ID            string `json:"id"`
	Reaction      string `json:"reaction"`
	ParticipantID *int   `json:"participantID"`
	RoomID        int    `json:"roomID"`
}

type ClearChat struct {
	ParticipantID int `json:"participantId"`
	RoomID        int `json:"roomID"`
}

type AssignRole struct {
	Role          RoomRole `json:"role"`
	ParticipantID int      `json:"participantId"`
	RoomID        int      `json:"roomID"`
}

type UpdateWelcomeMessage struct {
	RoomID         int    `json:"roomID"`
	WelcomeMessage string `json:"welcomeMessage"`
}
