package types

import "time"

type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Avatar   string `json:"avatar"`
}

type Profile struct {
	User
	Bio            *string `json:"bio,omitempty"`
	IsMe           bool    `json:"isMe"`
	IsFollowing    bool    `json:"isFollowing"`
	IsFriend       bool    `json:"isFriend"`
	FriendsCount   int     `json:"friendsCount"`
	FollowingCount int     `json:"followingCount"`
	FollowersCount int     `json:"followersCount"`
}

type Participant struct {
	User
	SID      string    `json:"sid"`
	Status   string    `json:"status,omitempty"`
	JoinedAt time.Time `json:"joinedAt"`
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

type Kick struct {
	RoomID    int
	UserID    int
	ExpiredAt time.Time
}

type Config struct {
	CookieExpiration time.Duration `env:"COOKIE_EXPIRATION"`
	GoogleOAuth      struct {
		RedirectURL  string `env:"GOOGLE_OAUTH_REDIRECT_URL"`
		ClientID     string `env:"GOOGLE_OAUTH_CLIENT_ID"`
		ClientSecret string `env:"GOOGLE_OAUTH_CLIENT_SECRET"`
	}
	PostgresURL    string `env:"POSTGRES_URL"`
	WebURL         string `env:"WEB_URL"`
	MaxRoomsHosted int    `env:"MAX_ROOMS_HOSTED"`
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

type Message struct {
	ID          string            `json:"id"`
	Content     string            `json:"content"`
	From        User              `json:"from"`
	ReplyTo     *string           `json:"replyTo,omitempty"`
	CreatedAt   time.Time         `json:"createdAt"`
	RoomID      *int              `json:"roomID,omitempty"`
	Reactions   *map[string][]int `json:"reactions,omitempty"`
	Participant *User             `json:"participant,omitempty"`
	IsDeleted   bool              `json:"isDeleted"`
	IsEdited    bool              `json:"isEdited"`
}

type MessageResponse struct {
	Message
	Reactions *map[string]map[int]struct{} `json:"reactions,omitempty"`
}

type MsgType int

const (
	UnknowMsg MsgType = iota
	RoomMsg
	PrivateRoomMsg
	DMMsg
)

type Relation string

const (
	RelationFollowing Relation = "following"
	RelationFriends   Relation = "friends"
	RelationFollowers Relation = "followers"
)

type RelationRes struct {
	User
	IsFriend bool `json:"isFriend"`
}

type DMResponse struct {
	DmID        int            `json:"dmID"`
	User        User           `json:"user"`
	LastMessage map[string]any `json:"lastMessage"`
}
