package types

import "time"

type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Avatar   string `json:"avatar"`
}

type Participant struct {
	User
	Status string `json:"status,omitempty"`
}

type Room struct {
	ID              int          `json:"id"`
	Topic           string       `json:"topic"`
	Languages       []string     `json:"languages"`
	MaxParticipants int          `json:"maxParticipants"`
	CreatedAt       time.Time    `json:"createdAt"`
	CreatedBy       int          `json:"-"`
	Settings        RoomSettings `json:"settings"`
}

type RoomSettings struct {
	RoomID         int     `json:"-"`
	WelcomeMessage *string `json:"welcomeMessage,omitempty"`
	Host           User    `json:"host"`
	CoHosts        []int   `json:"coHosts,omitempty"`
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

type RoomsResponse struct {
	*Room
	Participants []*Participant `json:"participants"`
}

type RoomRole string

const (
	RoomRoleHost   RoomRole = "host"
	RoomRoleCoHost RoomRole = "coHost"
	RoomRoleGuest  RoomRole = "guest"
)
