package db

import (
	t "backend/types"
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repo struct {
	pool *pgxpool.Pool
	conf *t.Config
}

type RoomFilter struct {
	RoomID *int
	UserID *int
}

func NewRepo(pool *pgxpool.Pool, conf *t.Config) *Repo {
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

func (r *Repo) DeleteRooms(ctx context.Context, roomIDs []int) error {
	query := `
		DELETE FROM rooms WHERE id = any($1);
	`
	_, err := r.pool.Exec(ctx, query, roomIDs)
	return err
}

func (r *Repo) CreateUser(ctx context.Context, u *t.GoogleUserInfo) (int, error) {
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

func (r *Repo) GetUserFromSession(ctx context.Context, sessionID string) (*t.User, error) {
	query := `
		SELECT u.id, u.username, u.avatar 
		FROM users u 
		LEFT JOIN sessions s ON s.user_id = u.id
		WHERE s.id = $1 AND s.expired_at > CURRENT_TIMESTAMP;
	`
	var u t.User
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

func (r *Repo) CreateRoom(ctx context.Context, room *t.Room) (int, error) {
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

func (r *Repo) GetRooms(ctx context.Context) ([]*t.Room, error) {
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

	var rooms []*t.Room
	for rows.Next() {
		var room t.Room
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

func (r *Repo) GetRoom(ctx context.Context, roomID int) (*t.Room, error) {
	return r.getRoom(ctx, RoomFilter{
		RoomID: &roomID,
	})
}

func (r *Repo) GetRoomForUser(ctx context.Context, roomID, userID int) (*t.Room, error) {
	return r.getRoom(ctx, RoomFilter{
		RoomID: &roomID,
		UserID: &userID,
	})
}

func (r *Repo) GetKick(ctx context.Context, roomID, userID int) (*t.Kick, error) {
	query := `
	  SELECT expired_at FROM room_kicks
	  WHERE room_id = $1 AND user_id = $2 
	  AND expired_at > CURRENT_TIMESTAMP
	  ORDER BY created_at DESC LIMIT 1;
	`
	var k t.Kick
	err := r.pool.QueryRow(ctx, query, roomID, userID).Scan(&k.ExpiredAt)
	return &k, err
}

func (r *Repo) UpdateRoom(ctx context.Context, room *t.Room) error {
	query := `
	  UPDATE rooms 
	  SET topic = $1, max_participants = $2, languages = $3
	  WHERE id = $4;
	`
	_, err := r.pool.Exec(ctx, query, room.Topic, room.MaxParticipants, room.Languages, room.ID)
	return err
}

func (r *Repo) GetRoomSettings(ctx context.Context, roomID int) (*t.RoomSettings, error) {
	query := `
	  SELECT s.room_id, u.id, u.username, u.avatar, s.co_hosts, s.welcome_message
	  FROM room_settings s INNER JOIN users u on u.id = s.host
	  WHERE room_id = $1;
	`

	var s t.RoomSettings
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

func (r *Repo) KickParticipant(ctx context.Context, k *t.Kick) error {
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

func (r *Repo) UpdateRoomSettings(ctx context.Context, s *t.RoomSettings) error {
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

func (r *Repo) getRoom(ctx context.Context, filter RoomFilter) (*t.Room, error) {
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

	var room t.Room
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

func (r *Repo) GetProfile(ctx context.Context, userID int, profileID int) (*t.Profile, error) {
	query := `
		select 
		  id, 
		  username, 
	    avatar,
		  id = $1 as is_me,
		  EXISTS 
			  (select 1 from follows f where f.follower_id = $1 AND f.followee_id = $2) as is_following,
			(select count(*) from follows f where f.followee_id = $2) as followers_count,
			(select count(*) from follows f where f.follower_id = $2) as following_count,
		  exists (
				select 1 from
				follows f1 
				join follows f2 
				on f1.follower_id = f2.followee_id AND f1.followee_id = f2.follower_id
				where f1.follower_id = $2 AND f1.followee_id = $1
			) as is_friend,
		  (
				select count(*) from 
				follows f1 
				join follows f2 
				on f1.follower_id = f2.followee_id AND f1.followee_id = f2.follower_id
				where f1.follower_id = $2
		  ) as friends_count
		from users where id = $2;
	`

	var profile t.Profile
	err := r.pool.QueryRow(ctx, query, userID, profileID).Scan(
		&profile.ID,
		&profile.Username,
		&profile.Avatar,
		&profile.IsMe,
		&profile.IsFollowing,
		&profile.FollowersCount,
		&profile.FollowingCount,
		&profile.IsFriend,
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

func (r *Repo) CreateMessage(ctx context.Context, dmID int, msg *t.Message) error {
	query := `
	  INSERT INTO messages (dm_id, id, content, "from", reply_to, created_at) 
	  VALUES($1, $2, $3, $4, $5, $6);
	`
	_, err := r.pool.Exec(ctx, query, dmID, msg.ID, msg.Content, msg.From.ID, msg.ReplyTo, msg.CreatedAt)
	return err
}

func (r *Repo) GetMessage(ctx context.Context, dmID int, msgID string, userID int, isReaction bool) (*t.Message, error) {
	query := `
	 SELECT m.id, m.content, m.is_edited, m.is_deleted, m.reactions,
	        u.id, u.avatar, u.username
	 FROM messages m
	 INNER JOIN users u on u.id = m."from"
	 WHERE dm_id = $1 AND m.id = $2 AND (m."from" = $3 OR $4 = True)
	`
	var m t.Message
	err := r.pool.QueryRow(ctx, query, dmID, msgID, userID, isReaction).Scan(
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

func (r *Repo) UpdateMessage(ctx context.Context, dmID int, msg *t.Message, isReaction bool) error {
	query := `
	 UPDATE messages
	 SET
	   content = $5,
	   is_edited = $6,
	   is_deleted = $7,
	   reactions = $8
	 WHERE dm_id = $1 AND id = $2 AND ("from" = $3 OR $4 = True)
	`
	_, err := r.pool.Exec(
		ctx,
		query,
		dmID,
		msg.ID,
		msg.From.ID,
		isReaction,
		msg.Content,
		msg.IsEdited,
		msg.IsDeleted,
		msg.Reactions,
	)
	return err
}

func (r *Repo) GetRelations(ctx context.Context, userID int, relation t.Relation) ([]*t.RelationRes, error) {
	var query string

	switch relation {
	case t.RelationFollowers:
		query = `
			SELECT u.id, u.username, u.avatar,
			  EXISTS (
			  	SELECT 1 
			  	FROM follows f2 
			  	WHERE f2.follower_id = $1 AND f2.followee_id = u.id
			  ) AS is_friend
			FROM users u
			JOIN follows f ON u.id = f.follower_id
			WHERE f.followee_id = $1;
		`
	case t.RelationFollowing:
		query = `
			SELECT u.id, u.username, u.avatar,
			EXISTS (
		    SELECT 1 
		    FROM follows f2 
		    WHERE f2.follower_id = u.id AND f2.followee_id = $1
		  ) AS is_friend
			FROM users u
			JOIN follows f ON u.id = f.followee_id
			WHERE f.follower_id = $1;
		`
	case t.RelationFriends:
		query = `
			SELECT u.id, u.username, u.avatar, True as is_friend
			FROM users u
			JOIN follows f1 ON u.id = f1.followee_id
			JOIN follows f2 ON u.id = f2.follower_id
			WHERE f1.follower_id = $1 AND f2.followee_id = $1;
		`
	}

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]*t.RelationRes, 0)
	for rows.Next() {
		var user t.RelationRes
		err := rows.Scan(&user.ID, &user.Username, &user.Avatar, &user.IsFriend)
		if err != nil {
			return nil, err
		}
		users = append(users, &user)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

func (r *Repo) GetDMs(ctx context.Context, userID int) ([]*t.DMResponse, error) {
	query := `
	SELECT * FROM (
   SELECT dp1.dm_id, u.id, u.username, u.avatar, 
	  	(SELECT json_build_object('content', m.content, 'isDeleted', m.is_deleted, 'createdAt', m.created_at,  'from', 
	  		json_build_object('id', u.id, 'username', u.username, 'avatar', u.avatar),
				'isUnread', (dp1.last_read_at IS NULL OR dp1.last_read_at < m.created_at) AND m."from" != $1) 
	  		FROM messages m JOIN users u ON u.id = m."from" 
	  		WHERE m.dm_id = dp1.dm_id 
	  		ORDER BY m.created_at DESC LIMIT 1
	  	) AS last_message
	  FROM dm_participants dp1 
	  JOIN dm_participants dp2 ON dp2.dm_id = dp1.dm_id
	  JOIN users u ON u.id = dp2.user_id
	  JOIN follows f1 ON f1.follower_id = dp1.user_id AND f1.followee_id = dp2.user_id
	  JOIN follows f2 ON f2.follower_id = dp2.user_id AND f2.followee_id = dp1.user_id
	  WHERE dp1.user_id = $1 AND dp2.user_id != $1
   ) AS sq ORDER BY (sq.last_message->>'createdAt')::timestamp DESC;
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	dms := make([]*t.DMResponse, 0)
	for rows.Next() {
		var dm t.DMResponse
		err := rows.Scan(
			&dm.DmID,
			&dm.User.ID,
			&dm.User.Username,
			&dm.User.Avatar,
			&dm.LastMessage,
		)
		if err != nil {
			return nil, err
		}

		// a better way might exists, but for now this is ok
		lm, ok := dm.LastMessage["createdAt"].(string)
		if ok {
			dm.LastMessage["createdAt"] = lm + "Z"
		}

		dms = append(dms, &dm)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return dms, nil
}

func (r *Repo) UpdateDMs(ctx context.Context, userID int, participantID int) error {
	query := `
	 UPDATE dm_participants dp SET last_read_at = NOW()
	 WHERE dm_id in (
		SELECT dp1.dm_id from dm_participants dp1 
		JOIN dm_participants dp2 ON dp2.dm_id = dp1.dm_id
		WHERE dp1.user_id = $1 AND dp2.user_id = $2
	 ) AND dp.user_id = $1
	`
	_, err := r.pool.Exec(ctx, query, userID, participantID)
	return err
}

func (r *Repo) GetMessages(ctx context.Context, userID, participantID int, cursor *time.Time) ([]*t.Message, error) {
	var isCursored bool
	if cursor != nil {
		isCursored = true
	}
	query := `
	  SELECT * FROM (
			SELECT m.id, m.content, m.is_edited, m.is_deleted, m.reply_to, 
				m.reactions, m.created_at, u.id, u.username, u.avatar
			FROM messages m JOIN users u ON u.id = m."from"
			WHERE dm_id = (
				SELECT dp1.dm_id from dm_participants dp1 
				JOIN dm_participants dp2 ON dp2.dm_id = dp1.dm_id
				WHERE dp1.user_id = $1 AND dp2.user_id = $2
			) AND ($3 = FALSE OR m.created_at < $4) ORDER BY m.created_at DESC LIMIT 50
	  ) ORDER BY created_at ASC;
	`
	rows, err := r.pool.Query(ctx, query, userID, participantID, isCursored, cursor)
	if err != nil {
		return nil, err
	}
	messages := make([]*t.Message, 0)
	for rows.Next() {
		var msg t.Message
		err := rows.Scan(&msg.ID, &msg.Content, &msg.IsEdited,
			&msg.IsDeleted, &msg.ReplyTo, &msg.Reactions, &msg.CreatedAt,
			&msg.From.ID, &msg.From.Username, &msg.From.Avatar)
		if err != nil {
			return nil, err
		}
		messages = append(messages, &msg)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return messages, nil
}
