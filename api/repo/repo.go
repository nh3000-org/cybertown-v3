package repo

import (
	"context"

	"github.com/jackc/pgx/v4/pgxpool"
)

type Repo struct {
	pool *pgxpool.Pool
}

func NewRepo(dbURL string) (*Repo, error) {
	pool, err := pgxpool.Connect(context.Background(), dbURL)
	if err != nil {
		return nil, err
	}
	return &Repo{
		pool: pool,
	}, nil
}
