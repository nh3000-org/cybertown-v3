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
	Topic           string   `json:"topic"`
	MaxParticipants int      `json:"maxParticipants"`
	Languages       []string `json:"languages"`
}

func (r *CreateRoomRequest) Validate() (bool, error) {
	vd := v.NewValidator()
	vd.Count("topic", &r.Topic, "min", minTopicLen).
		Count("topic", &r.Topic, "max", maxTopicLen).
		CountSlice("language", r.Languages, "min", 1).
		IsInSlice("language", r.Languages, allowedLanguages).
		IsInInt("maxParticipants", r.MaxParticipants, allowedMaxParticipants)
	return vd.IsValid(), vd
}
