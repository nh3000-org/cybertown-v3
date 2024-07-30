package types

import "time"

type User struct {
	ID             int    `json:"id"`
	Username       string `json:"username"`
	Avatar         string `json:"avatar"`
	FollowersCount int    `json:"-"`
	FollowingCount int    `json:"-"`
	FriendsCount   int    `json:"-"`
}

type Room struct {
	ID              string `json:"id"`
	Topic           string `json:"topic"`
	Language        string `json:"language"`
	MaxParticipants int    `json:"maxParticipants"`
	CreatedBy       int    `json:"createdBy"`
}

type GoogleOAuthToken struct {
	AccessToken string `json:"access_token"`
	BearerToken string `json:"id_token"`
}

type GoogleUserInfo struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Picture       string `json:"picture"`
}

type Config struct {
	CookieExpiration time.Duration `env:"COOKIE_EXPIRATION"`
	GoogleOAuth      struct {
		RedirectURL  string `env:"GOOGLE_OAUTH_REDIRECT_URL"`
		ClientID     string `env:"GOOGLE_OAUTH_CLIENT_ID"`
		ClientSecret string `env:"GOOGLE_OAUTH_CLIENT_SECRET"`
	}
	PostgresURL string `env:"POSTGRES_URL"`
	RedirectURL string `env:"REDIRECT_URL"`
}

type CreateRoomRequest struct {
	Topic           string `json:"topic"`
	MaxParticipants int    `json:"maxParticipants"`
	Language        string `json:"language"`
}
