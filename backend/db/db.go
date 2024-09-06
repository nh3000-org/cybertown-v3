package db

import (
	"backend/types"
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repo struct {
	pool *pgxpool.Pool
	conf *types.Config
}

type RoomFilter struct {
	RoomID *int
	UserID *int
}

func NewRepo(pool *pgxpool.Pool, conf *types.Config) *Repo {
	return &Repo{
		pool: pool,
		conf: conf,
	}
}

func NewPool(url string) *pgxpool.Pool {
	ctx := context.Background()

	p, err := pgxpool.New(ctx, url)
	if err != nil {
		log.Fatalf("failed to create postgres connection pool: %v", err)
	}

	if err := p.Ping(ctx); err != nil {
		log.Fatalf("failed to ping postgres db: %v", err)
	}

	log.Println("connected to database")
	return p
}

func (r *Repo) CreateUser(ctx context.Context, u *types.GoogleUserInfo) (int, error) {
	query := `
	  INSERT INTO users(oauth_id, username, email, avatar)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (oauth_id)
	  DO UPDATE SET
	    email = excluded.email,
	    avatar = excluded.avatar,
	    username = excluded.username
	  RETURNING id;
	`
	var userID int
	err := r.pool.QueryRow(ctx, query, u.ID, u.Name, u.Email, u.Picture).Scan(&userID)
	return userID, err
}

func (r *Repo) CreateSession(ctx context.Context, userID int, expiredAt time.Time) (string, error) {
	query := `
	  INSERT INTO sessions(user_id, expired_at)
		VALUES ($1, $2)
	  RETURNING id;
	`
	var sessionID string
	err := r.pool.QueryRow(ctx, query, userID, expiredAt).Scan(&sessionID)
	return sessionID, err
}

func (r *Repo) GetUserFromSession(ctx context.Context, sessionID string) (*types.User, error) {
	query := `
		SELECT u.id, u.username, u.avatar 
		FROM users u 
		LEFT JOIN sessions s ON s.user_id = u.id
		WHERE s.id = $1 AND s.expired_at > CURRENT_TIMESTAMP;
	`
	var u types.User
	err := r.pool.QueryRow(ctx, query, sessionID).Scan(&u.ID, &u.Username, &u.Avatar)
	return &u, err
}

func (r *Repo) DeleteSessionForUser(ctx context.Context, sessionID string, userID int) error {
	query := `
		DELETE FROM sessions s
	  WHERE s.id = $1 AND s.user_id = $2;
	`
	_, err := r.pool.Exec(ctx, query, sessionID, userID)
	return err
}

func (r *Repo) CreateRoom(ctx context.Context, room *types.Room) (int, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO rooms(topic, max_participants, languages, created_by)
		VALUES ($1, $2, $3, $4)
	  RETURNING id;
	`

	var roomID int
	err = tx.QueryRow(ctx, query, room.Topic, room.MaxParticipants, room.Languages, room.CreatedBy).Scan(&roomID)
	if err != nil {
		return 0, err
	}

	query = `
	 INSERT INTO room_settings(room_id, host)
	 VALUES ($1, $2);
  `
	_, err = tx.Exec(ctx, query, roomID, room.CreatedBy)
	if err != nil {
		return 0, err
	}

	err = tx.Commit(ctx)
	if err != nil {
		return 0, err
	}

	return roomID, nil
}

func (r *Repo) GetRooms(ctx context.Context) ([]*types.Room, error) {
	query := `
	  SELECT r.id, r.topic, r.max_participants, r.languages, r.created_at,
	  u.id, u.username, u.avatar, s.co_hosts, s.welcome_message
	  FROM rooms r 
	  INNER JOIN room_settings s ON s.room_id = r.id
	  INNER JOIN users u ON u.id = s.host
	  ORDER BY r.created_at DESC;
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}

	var rooms []*types.Room
	for rows.Next() {
		var room types.Room
		err := rows.Scan(
			&room.ID,
			&room.Topic,
			&room.MaxParticipants,
			&room.Languages,
			&room.CreatedAt,
			&room.Settings.Host.ID,
			&room.Settings.Host.Username,
			&room.Settings.Host.Avatar,
			&room.Settings.CoHosts,
			&room.Settings.WelcomeMessage,
		)
		if err != nil {
			log.Printf("failed to scan room: %v", err)
			continue
		}
		rooms = append(rooms, &room)
	}

	return rooms, nil
}

func (r *Repo) GetRoom(ctx context.Context, roomID int) (*types.Room, error) {
	return r.getRoom(ctx, RoomFilter{
		RoomID: &roomID,
	})
}

func (r *Repo) GetRoomForUser(ctx context.Context, roomID, userID int) (*types.Room, error) {
	return r.getRoom(ctx, RoomFilter{
		RoomID: &roomID,
		UserID: &userID,
	})
}

func (r *Repo) GetKick(ctx context.Context, roomID, userID int) (*types.Kick, error) {
	query := `
	  SELECT expired_at FROM room_kicks
	  WHERE room_id = $1 AND user_id = $2 
	  AND expired_at > CURRENT_TIMESTAMP
	  ORDER BY created_at DESC LIMIT 1;
	`
	var k types.Kick
	err := r.pool.QueryRow(ctx, query, roomID, userID).Scan(&k.ExpiredAt)
	return &k, err
}

func (r *Repo) UpdateRoom(ctx context.Context, room *types.Room) error {
	query := `
	  UPDATE rooms 
	  SET topic = $1, max_participants = $2, languages = $3
	  WHERE id = $4;
	`
	_, err := r.pool.Exec(ctx, query, room.Topic, room.MaxParticipants, room.Languages, room.ID)
	return err
}

func (r *Repo) GetRoomSettings(ctx context.Context, roomID int) (*types.RoomSettings, error) {
	query := `
	  SELECT s.room_id, u.id, u.username, u.avatar, s.co_hosts, s.welcome_message
	  FROM room_settings s INNER JOIN users u on u.id = s.host
	  WHERE room_id = $1;
	`

	var s types.RoomSettings
	err := r.pool.QueryRow(ctx, query, roomID).Scan(
		&s.RoomID,
		&s.Host.ID,
		&s.Host.Username,
		&s.Host.Avatar,
		&s.CoHosts,
		&s.WelcomeMessage,
	)
	if err != nil {
		return nil, err
	}

	return &s, nil
}

func (r *Repo) KickParticipant(ctx context.Context, k *types.Kick) error {
	query := `
	  INSERT INTO room_kicks(room_id, user_id, expired_at)
		VALUES ($1, $2, $3);
	`
	_, err := r.pool.Exec(ctx, query, k.RoomID, k.UserID, k.ExpiredAt)
	return err
}

func (r *Repo) Follow(ctx context.Context, followerID, followeeID int) error {
	query := `
	  INSERT INTO follows(follower_id, followee_id)
		VALUES ($1, $2);
	`
	_, err := r.pool.Exec(ctx, query, followerID, followeeID)
	return err
}

func (r *Repo) Unfollow(ctx context.Context, followerID, followeeID int) error {
	query := `
	  DELETE FROM follows
	  WHERE follower_id = $1 AND followee_id = $2;
	`
	_, err := r.pool.Exec(ctx, query, followerID, followeeID)
	return err
}

func (r *Repo) UpdateRoomSettings(ctx context.Context, s *types.RoomSettings) error {
	query := `
	  UPDATE room_settings
	  SET host = $1, co_hosts = $2, welcome_message = $3
	  WHERE room_id = $4;
	`
	_, err := r.pool.Exec(ctx, query, s.Host.ID, s.CoHosts, s.WelcomeMessage, s.RoomID)
	if err != nil {
		return err
	}
	return nil
}

func (r *Repo) getRoom(ctx context.Context, filter RoomFilter) (*types.Room, error) {
	var values []any

	query := `
	  SELECT r.id, r.topic, r.max_participants, r.languages, r.created_at,
	  u.id, u.username, u.avatar, s.co_hosts, s.welcome_message
	  FROM rooms r 
	  INNER JOIN room_settings s ON s.room_id = r.id
	  INNER JOIN users u ON u.id = s.host
	  WHERE 1=1
	`

	if filter.RoomID != nil {
		values = append(values, filter.RoomID)
		query += fmt.Sprintf(" AND r.id = $%d", len(values))
	}

	if filter.UserID != nil {
		values = append(values, filter.UserID)
		query += fmt.Sprintf(" AND u.id = $%d", len(values))
	}

	var room types.Room
	err := r.pool.QueryRow(ctx, query, values...).Scan(
		&room.ID,
		&room.Topic,
		&room.MaxParticipants,
		&room.Languages,
		&room.CreatedAt,
		&room.Settings.Host.ID,
		&room.Settings.Host.Username,
		&room.Settings.Host.Avatar,
		&room.Settings.CoHosts,
		&room.Settings.WelcomeMessage,
	)
	if err != nil {
		return nil, err
	}

	return &room, nil
}

func (r *Repo) GetProfile(ctx context.Context, userID int, profileID int) (*types.Profile, error) {
	query := `
		WITH profile_user AS (
			SELECT id, username, avatar
			FROM users
			WHERE id = $2
		),
		followers_count AS (
			SELECT COUNT(*) AS count
			FROM follows
			WHERE followee_id = $2
		),
		following_count AS (
			SELECT COUNT(*) AS count
			FROM follows
			WHERE follower_id = $2
		),
		friends_count AS (
			SELECT COUNT(*) AS count
			FROM follows f1
			JOIN follows f2 ON f1.follower_id = f2.followee_id AND f1.followee_id = f2.follower_id
			WHERE f1.follower_id = $2
		)
		SELECT 
			pu.id,
			pu.username,
			pu.avatar,
			CASE WHEN $1 = $2 THEN TRUE ELSE FALSE END AS is_me,
			CASE WHEN EXISTS (
				SELECT 1 
				FROM follows 
				WHERE follower_id = $1 AND followee_id = $2
			) THEN TRUE ELSE FALSE END AS is_following,
			fc.count AS followers_count,
			fng.count AS following_count,
			fr.count AS friends_count
		FROM profile_user pu
		CROSS JOIN followers_count fc
		CROSS JOIN following_count fng
		CROSS JOIN friends_count fr;
	`

	var profile types.Profile
	err := r.pool.QueryRow(ctx, query, userID, profileID).Scan(
		&profile.ID,
		&profile.Username,
		&profile.Avatar,
		&profile.IsMe,
		&profile.IsFollowing,
		&profile.FollowersCount,
		&profile.FollowingCount,
		&profile.FriendsCount,
	)
	if err != nil {
		return nil, err
	}

	return &profile, nil
}

func (r *Repo) GetDM(ctx context.Context, userID, participantID int) (int, error) {
	query := `
		SELECT dp1.dm_id
		FROM dm_participants dp1
		JOIN dm_participants dp2 ON dp1.dm_id = dp2.dm_id
		WHERE dp1.user_id = $1 AND dp2.user_id = $2;
	`
	var dmID int
	err := r.pool.QueryRow(ctx, query, userID, participantID).Scan(&dmID)
	return dmID, err
}

func (r *Repo) CreateDM(ctx context.Context, userID, participantID int) (int, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO dms DEFAULT VALUES RETURNING id;
	`

	var dmID int
	err = r.pool.QueryRow(ctx, query).Scan(&dmID)
	if err != nil {
		return 0, err
	}

	query = `
		INSERT INTO dm_participants (dm_id, user_id) 
	  VALUES
	   ($1, $2), 
	   ($1, $3);
	`

	_, err = r.pool.Exec(ctx, query, dmID, userID, participantID)
	if err != nil {
		return 0, err
	}
	tx.Commit(ctx)

	return dmID, nil
}

func (r *Repo) IsFriends(ctx context.Context, userID, participantID int) (bool, error) {
	query := `
		SELECT EXISTS (
			SELECT 1
			FROM follows f1
			JOIN follows f2 ON f1.follower_id = f2.followee_id
			WHERE f1.follower_id = $1
				AND f1.followee_id = $2
				AND f2.follower_id = $2
				AND f2.followee_id = $1
		);
	`
	var isFriends bool
	err := r.pool.QueryRow(ctx, query, userID, participantID).Scan(&isFriends)
	return isFriends, err
}

func (r *Repo) CreateMessage(ctx context.Context, dmID int, msg *types.Message) error {
	query := `
	  INSERT INTO messages (dm_id, id, content, "from", reply_to, created_at) 
	  VALUES($1, $2, $3, $4, $5);
	`
	_, err := r.pool.Exec(ctx, query, dmID, msg.ID, msg.Content, msg.From.ID, msg.ReplyTo, msg.CreatedAt)
	return err
}

func (r *Repo) GetMessage(ctx context.Context, dmID int, msgID string, userID int, isReaction bool) (*types.Message, error) {
	query := `
	 SELECT m.id, m.content, m.is_edited, m.is_deleted, m.reactions,
	        u.id, u.avatar, u.username
	 FROm messages
	 INNER JOIN users u on u.id = m."from"
	 WHERE dm_id = $1 AND m.id = $2 AND (m."from" = $3 OR $4 == True)
	`
	var m types.Message
	err := r.pool.QueryRow(ctx, query, dmID, userID, isReaction).Scan(
		&m.ID,
		&m.Content,
		&m.IsEdited,
		&m.IsDeleted,
		&m.Reactions,
		&m.From.ID,
		&m.From.Avatar,
		&m.From.Username,
	)
	return &m, err
}

func (r *Repo) UpdateMessage(ctx context.Context, dmID int, msg *types.Message, isReaction bool) error {
	query := `
	 UPDATE messages
	 SET
	   content = $5
	   is_edited = $6
	   is_deleted = $7
	   reactions = $8
	 WHERE dm_id = $1 AND id = $2 AND ("from" = $3 OR $4 = True)
	`
	_, err := r.pool.Exec(
		ctx,
		query,
		dmID,
		msg.ID,
		isReaction,
		msg.From.ID,
		msg.Content,
		msg.IsEdited,
		msg.IsDeleted,
	)
	return err
}
