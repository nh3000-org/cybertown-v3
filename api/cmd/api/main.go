package main

import (
	"cybertown-api"
	"cybertown-api/http"
	"cybertown-api/repo"
	"cybertown-api/service"
	"log"

	"github.com/caarlos0/env/v11"
)

func main() {
	var cfg cybertown.Config
	err := env.Parse(&cfg)
	if err != nil {
		log.Fatalf("failed to parse env: %v", err)
		return
	}

	r, err := repo.NewRepo(cfg.PostgresURL)
	if err != nil {
		log.Fatalf("failed to connect to postgres: %v", err)
		return
	}

	svc := service.NewService(&cfg, r)
	h := http.NewHTTP(svc)

	if err := h.Start(cfg); err != nil {
		log.Fatalf("server stopped serving: %v", err)
	}
}
