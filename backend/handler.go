package main

import (
	"backend/types"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5"
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

	ok, err := req.Validate()
	if !ok {
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
		Languages:       req.Languages,
		CreatedBy:       u.ID,
	})

	if err != nil {
		serverError(w, err)
		return
	}

	app.ss.broadcastEvent(&types.Event{
		Name: "NEW_ROOM_BROADCAST",
		Data: map[string]any{
			"roomID": roomID,
		},
	})

	jsonResponse(w, http.StatusOK, map[string]any{
		"roomID": roomID,
	})
}

func (app *application) getRoomsHandler(w http.ResponseWriter, _ *http.Request) {
	rooms, err := app.repo.GetRooms(context.Background())
	if err != nil {
		serverError(w, err)
		return
	}

	var res []*types.RoomsResponse
	for _, room := range rooms {
		roomRes := types.RoomsResponse{
			Room:         room,
			Participants: app.ss.getParticipantsInRoom(room.ID),
		}
		res = append(res, &roomRes)
	}

	jsonResponse(w, http.StatusOK, map[string]any{
		"rooms": res,
	})
}

func (app *application) joinRoomHandler(w http.ResponseWriter, r *http.Request) {
	roomID := r.PathValue("roomID")
	id, err := strconv.Atoi(roomID)
	if err != nil {
		notFoundError(w, err)
		return
	}

	u, ok := r.Context().Value("user").(*types.User)
	if !ok {
		unauthRequest(w, nil)
		return
	}

	room, err := app.repo.GetRoom(context.Background(), id)
	if err != nil {
		if errors.Is(pgx.ErrNoRows, err) {
			notFoundError(w, err)
		} else {
			serverError(w, err)
		}
		return
	}

	participants := app.ss.getParticipantsInRoom(room.ID)
	if len(participants) >= room.MaxParticipants {
		badRequest(w, err)
		return
	}

	k, err := app.repo.GetKick(context.Background(), room.ID, u.ID)
	if nil == err {
		errorsResponse(w, http.StatusForbidden, map[string]any{
			"duration": k.Duration,
			"kickedAt": k.CreatedAt,
		})
		return
	}

	roomRes := types.RoomsResponse{
		Room:         room,
		Participants: participants,
	}

	jsonResponse(w, http.StatusOK, map[string]any{
		"room": roomRes,
	})
}

func (app *application) updateRoomHandler(w http.ResponseWriter, r *http.Request) {
	roomID := r.PathValue("roomID")
	id, err := strconv.Atoi(roomID)
	if err != nil {
		badRequest(w, err)
		return
	}

	var req types.CreateRoomRequest // same payload for editing a room as well
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		badRequest(w, err)
		return
	}

	ok, err := req.Validate()
	if !ok {
		badRequest(w, err)
		return
	}

	u, ok := r.Context().Value("user").(*types.User)
	if !ok {
		unauthRequest(w, nil)
		return
	}

	room, err := app.repo.GetRoomForUser(context.Background(), id, u.ID)
	if err != nil {
		serverError(w, err)
		return
	}
	room.Topic = req.Topic
	room.MaxParticipants = req.MaxParticipants
	room.Languages = req.Languages

	err = app.repo.UpdateRoom(context.Background(), room)
	if err != nil {
		serverError(w, err)
		return
	}

	app.ss.broadcastEvent(&types.Event{
		Name: "UPDATE_ROOM_BROADCAST",
		Data: map[string]any{
			"roomID": room.ID,
		},
	})

	msgResponse(w, "Room updated successfully")
}
