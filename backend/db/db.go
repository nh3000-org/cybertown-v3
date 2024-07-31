package db

import (
	"backend/types"
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repo struct {
	pool *pgxpool.Pool
	conf *types.Config
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

func (r *Repo) CreateSession(ctx context.Context, userID int) (string, error) {
	query := `
	  INSERT INTO sessions(user_id)
		VALUES ($1)
	  RETURNING id;
	`
	var sessionID string
	err := r.pool.QueryRow(ctx, query, userID).Scan(&sessionID)
	return sessionID, err
}

// created_at: 3.30 PM now: 4.00 PM, expiration: 15m
func (r *Repo) GetUserFromSession(ctx context.Context, sessionID string) (*types.User, error) {
	e := r.conf.CookieExpiration.Seconds()
	query := fmt.Sprintf(`
		SELECT u.id, u.username, u.avatar 
		FROM users u 
		LEFT JOIN sessions s ON s.user_id = u.id
		WHERE s.id = $1 AND NOW() <= (s.created_at + interval '%d seconds');
  `, int(e))
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
	query := `
		INSERT INTO rooms(topic, max_participants, language, created_by)
		VALUES ($1, $2, $3, $4)
	  RETURNING id;
	`
	var roomID int
	err := r.pool.QueryRow(ctx, query, room.Topic, room.MaxParticipants, room.Language, room.CreatedBy).Scan(&roomID)
	return roomID, err
}

func (r *Repo) ListRooms(ctx context.Context) ([]*types.Room, error) {
	query := `
	  SELECT id, topic, max_participants, language, created_by 
	  FROM rooms;
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}

	var rooms []*types.Room
	for rows.Next() {
		var room types.Room
		err := rows.Scan(&room.ID, &room.Topic, &room.MaxParticipants, &room.Language, &room.CreatedBy)
		if err != nil {
			log.Printf("failed to scan room: %v", err)
			continue
		}
		rooms = append(rooms, &room)
	}

	return rooms, nil
}

func (r *Repo) ListRoom(ctx context.Context, roomID int) (*types.Room, error) {
	query := `
	  SELECT id, topic, max_participants, language, created_by 
	  FROM rooms WHERE id = $1;
	`
	var room types.Room
	err := r.pool.QueryRow(ctx, query, roomID).Scan(&room.ID, &room.Topic, &room.MaxParticipants, &room.Language, &room.CreatedBy)
	if err != nil {
		return nil, err
	}
	return &room, nil
}
