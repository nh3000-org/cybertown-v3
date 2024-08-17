package types

import (
	v "backend/validator"
)

const (
	minTopicLen = 3
	maxTopicLen = 128
)

var (
	allowedLanguages       = []string{"english", "hindi", "tamil", "indonesian", "vietnamese"}
	allowedMaxParticipants = []int{-1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
)

type CreateRoomRequest struct {
	Topic           string `json:"topic"`
	MaxParticipants int    `json:"maxParticipants"`
	Language        string `json:"language"`
}

func (r *CreateRoomRequest) Validate() (bool, error) {
	vd := v.NewValidator()
	vd.Count("topic", &r.Topic, "min", minTopicLen).
		Count("topic", &r.Topic, "max", maxTopicLen).
		IsInStr("language", &r.Language, allowedLanguages).
		IsInInt("maxParticipants", r.MaxParticipants, allowedMaxParticipants)
	return vd.IsValid(), vd
}
