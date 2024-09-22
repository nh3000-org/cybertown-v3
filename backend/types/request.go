package types

import (
	v "backend/validator"
	"net/url"
)

const (
	minTopicLen = 3
	maxTopicLen = 128
)

var (
	allowedMaxParticipants = []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20}
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
		IsInInt("maxParticipants", r.MaxParticipants, allowedMaxParticipants)

	if !IsInAllowedLanguages(r.Languages) {
		vd.Errors["language"] = "invalid language"
	}

	return vd.IsValid(), vd
}

type OAuthState struct {
	RedirectURL string `json:"redirectURL"`
}

func (s *OAuthState) Validate(config *Config) bool {
	a, err := url.Parse(s.RedirectURL)
	if err != nil {
		return false
	}
	b, err := url.Parse(config.WebURL)
	if err != nil {
		return false
	}
	return a.Host == b.Host
}
