package main

import (
	"backend/db"
	"backend/service"
	"backend/types"
	"backend/utils"
	"context"
	"log"
	"net/http"

	"github.com/caarlos0/env/v11"
	"github.com/joho/godotenv"
)

type application struct {
	repo *db.Repo
	svc  *service.Service
	conf *types.Config
	ss   *socketServer
}

func main() {
	godotenv.Load()

	var conf types.Config
	if err := env.Parse(&conf); err != nil {
		log.Fatalf("failed to parse config: %v", err)
	}

	pool := db.NewPool(conf.PostgresURL)
	defer pool.Close()

	emojis, err := utils.GetEmojis()
	if err != nil {
		log.Fatalf("failed to fetch emojis: %v", err)
	}

	repo := db.NewRepo(pool, &conf)
	svc := service.NewService(&conf, repo)
	app := application{
		repo: repo,
		svc:  svc,
		conf: &conf,
		ss:   newSocketServer(repo, svc, emojis),
	}

	server := http.Server{
		Addr:    ":6969",
		Handler: app.enableCORS(app.router()),
	}

	app.ss.populateRooms()
	go app.deleteInactiveRooms(context.Background())

	log.Println("server starting at port 6969")
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("server destroyed: %v", err)
	}
}
