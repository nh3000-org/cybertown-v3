package http

import (
	"cybertown-api"
	"cybertown-api/service"
	"fmt"
	"net/http"
)

type HTTP struct {
	svc *service.Service
}

func NewHTTP(svc *service.Service) *HTTP {
	return &HTTP{
		svc: svc,
	}
}

func (h *HTTP) Start(cfg cybertown.Config) error {
	mux := http.NewServeMux()

	registerUserRoutes(mux)

	addr := fmt.Sprintf(":%d", cfg.Port)
	return http.ListenAndServe(addr, mux)
}
