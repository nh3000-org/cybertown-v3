package main

import "net/http"

func (app *application) router() http.Handler {
	router := http.NewServeMux()

	ensureAuthed := createStack(app.authMiddleware, app.isAuthenticated)

	router.HandleFunc("GET /auth/google/callback", app.authCallbackHandler)
	router.Handle("DELETE /auth/logout", ensureAuthed(http.HandlerFunc(app.logoutHandler)))

	router.Handle("POST /rooms", ensureAuthed(http.HandlerFunc(app.createRoomHandler)))
	router.HandleFunc("GET /rooms", app.getRoomsHandler)
	router.Handle("GET /rooms/{roomID}", http.HandlerFunc(app.getRoomHandler))

	router.Handle("GET /me", ensureAuthed(http.HandlerFunc(app.meHandler)))

	v1 := http.NewServeMux()
	v1.Handle("/api/v1/", http.StripPrefix("/api/v1", router))

	v1.Handle("/ws", app.authMiddleware(http.HandlerFunc(app.wsHandler)))

	return v1
}
