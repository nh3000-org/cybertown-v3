package main

import (
	"backend/types"
	"context"
	"encoding/json"
	"net/http"
	"strconv"
)

func (app *application) authCallbackHandler(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")

	t, err := app.svc.GetGoogleOAuthTokens(code)
	if err != nil {
		serverError(w, err)
		return
	}

	u, err := app.svc.GetGoogleOAuthUserInfo(t)
	if err != nil {
		serverError(w, err)
		return
	}

	userID, err := app.repo.CreateUser(context.Background(), u)
	if err != nil {
		serverError(w, err)
		return
	}

	sessionID, err := app.repo.CreateSession(context.Background(), userID)
	if err != nil {
		serverError(w, err)
		return
	}

	cookie := &http.Cookie{
		Name:     "session",
		Value:    sessionID,
		Path:     "/",
		MaxAge:   int(app.conf.CookieExpiration.Seconds()),
		SameSite: http.SameSiteLaxMode,
		HttpOnly: true,
		Secure:   true,
	}

	http.SetCookie(w, cookie)
	http.Redirect(w, r, app.conf.RedirectURL, http.StatusTemporaryRedirect)
}

func (app *application) meHandler(w http.ResponseWriter, r *http.Request) {
	u, ok := r.Context().Value("user").(*types.User)
	if !ok {
		unauthRequest(w, nil)
		return
	}

	data := map[string]any{
		"user": u,
	}

	jsonResponse(w, http.StatusOK, data)
}

func (app *application) logoutHandler(w http.ResponseWriter, r *http.Request) {
	u, ok := r.Context().Value("user").(*types.User)
	if !ok {
		unauthRequest(w, nil)
		return
	}

	c, err := r.Cookie("session")
	if err != nil {
		unauthRequest(w, nil)
		return
	}

	err = app.repo.DeleteSessionForUser(context.Background(), c.Value, u.ID)
	if err != nil {
		serverError(w, err)
		return
	}

	emptyCookie := http.Cookie{
		Name:     "session",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		SameSite: http.SameSiteLaxMode,
		HttpOnly: true,
		Secure:   true,
	}

	http.SetCookie(w, &emptyCookie)
	msgResponse(w, "Logged out")
}

func (app *application) createRoomHandler(w http.ResponseWriter, r *http.Request) {
	var req types.CreateRoomRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		badRequest(w, err)
		return
	}

	u, ok := r.Context().Value("user").(*types.User)
	if !ok {
		unauthRequest(w, nil)
		return
	}

	roomID, err := app.repo.CreateRoom(context.Background(), &types.Room{
		Topic:           req.Topic,
		MaxParticipants: req.MaxParticipants,
		Language:        req.Language,
		CreatedBy:       u.ID,
	})

	if err != nil {
		serverError(w, err)
		return
	}

	jsonResponse(w, http.StatusOK, map[string]any{
		"roomID": roomID,
	})
}

func (app *application) getRoomsHandler(w http.ResponseWriter, _ *http.Request) {
	rooms, err := app.repo.ListRooms(context.Background())
	if err != nil {
		serverError(w, err)
		return
	}

	var res []*types.RoomsResponse
	for _, room := range rooms {
		roomRes := types.RoomsResponse{
			Room:  room,
			Users: make([]*types.User, 0),
		}
		if _, ok := ss.rooms[room.ID]; ok {
			for conn := range ss.rooms[room.ID] {
				if u, ok := ss.conns[conn]; ok {
					roomRes.Users = append(roomRes.Users, u)
				}
			}
		}
		res = append(res, &roomRes)
	}

	jsonResponse(w, http.StatusOK, map[string]any{
		"rooms": res,
	})
}

func (app *application) getRoomHandler(w http.ResponseWriter, r *http.Request) {
	roomID := r.PathValue("roomID")

	id, err := strconv.Atoi(roomID)
	if err != nil {
		badRequest(w, err)
		return
	}

	room, err := app.repo.ListRoom(context.Background(), id)
	if err != nil {
		serverError(w, err)
		return
	}

	roomRes := types.RoomsResponse{
		Room:  room,
		Users: make([]*types.User, 0),
	}
	if _, ok := ss.rooms[room.ID]; ok {
		for conn := range ss.rooms[room.ID] {
			if u, ok := ss.conns[conn]; ok {
				roomRes.Users = append(roomRes.Users, u)
			}
		}
	}

	jsonResponse(w, http.StatusOK, map[string]any{
		"room": roomRes,
	})
}
