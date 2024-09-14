package service

import (
	"cybertown-api"
	"cybertown-api/repo"
)

type Service struct {
	cfg  *cybertown.Config
	repo *repo.Repo
}

func NewService(cfg *cybertown.Config, repo *repo.Repo) *Service {
	return &Service{
		cfg:  cfg,
		repo: repo,
	}
}
