package main

import (
	"backend/db"
	"backend/service"
	"backend/types"
	"log"
	"net/http"

	"github.com/caarlos0/env/v11"
	"github.com/joho/godotenv"
)

type application struct {
	repo *db.Repo
	svc  *service.Service
	conf *types.Config
}

func main() {
	godotenv.Load()

	var conf types.Config
	if err := env.Parse(&conf); err != nil {
		log.Fatalf("failed to parse config: %v", err)
	}

	pool := db.NewPool(conf.PostgresURL)
	defer pool.Close()

	app := application{
		repo: db.NewRepo(pool, &conf),
		svc:  service.NewService(&conf),
		conf: &conf,
	}

	server := http.Server{
		Addr:    ":6969",
		Handler: app.enableCORS(app.router()),
	}

	log.Println("server starting at port 6969")
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("server destroyed: %v", err)
	}
}
