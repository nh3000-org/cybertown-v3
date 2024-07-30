package main

import "net/http"

func (app *application) router() http.Handler {
	router := http.NewServeMux()

	router.HandleFunc("GET /auth/google/callback", app.authCallbackHandler)
	router.Handle("DELETE /auth/logout", app.authMiddleware(http.HandlerFunc(app.logoutHandler)))

	router.Handle("POST /rooms", app.authMiddleware(http.HandlerFunc(app.createRoomHandler)))
	router.Handle("GET /rooms", http.HandlerFunc(app.listRoomsHandler))

	router.Handle("GET /me", app.authMiddleware(http.HandlerFunc(app.meHandler)))

	v1 := http.NewServeMux()
	v1.Handle("/api/v1/", http.StripPrefix("/api/v1", router))

	return v1
}
