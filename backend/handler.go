package main

import (
	"backend/types"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
)

func (app *application) authCallbackHandler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	code := q.Get("code")
	s := q.Get("state")

	var state types.OAuthState
	err := json.Unmarshal([]byte(s), &state)
	if err != nil || !state.Validate(app.conf) {
		badRequest(w, err)
		return
	}

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

	expiredAt := time.Now().UTC().Add(app.conf.CookieExpiration)
	sessionID, err := app.repo.CreateSession(context.Background(), userID, expiredAt)
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
	http.Redirect(w, r, state.RedirectURL, http.StatusTemporaryRedirect)
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
			"expiredAt": k.ExpiredAt,
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

func (app *application) followHandler(isFollow bool) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			FolloweeID int `json:"followeeID"`
		}

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

		if u.ID == req.FolloweeID {
			badRequest(w, nil)
			return
		}

		if isFollow {
			err = app.repo.Follow(context.Background(), u.ID, req.FolloweeID)
		} else {
			err = app.repo.Unfollow(context.Background(), u.ID, req.FolloweeID)
		}

		if err != nil {
			serverError(w, err)
			return
		}

		msgResponse(w, "ok")
	}
}

func (app *application) profileHandler(w http.ResponseWriter, r *http.Request) {
	profileID := r.PathValue("profileID")
	pID, err := strconv.Atoi(profileID)
	if err != nil {
		badRequest(w, err)
		return
	}

	u, ok := r.Context().Value("user").(*types.User)
	if !ok {
		unauthRequest(w, nil)
		return
	}

	p, err := app.repo.GetProfile(context.Background(), u.ID, pID)
	if err != nil {
		serverError(w, err)
		return
	}

	jsonResponse(w, http.StatusOK, map[string]any{
		"profile": p,
	})
}

func (app *application) createDMHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ParticipantID int `json:"participantID"`
	}
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

	if u.ID == req.ParticipantID {
		badRequest(w, nil)
		return
	}

	dmID, err := app.svc.CreateDM(context.Background(), u.ID, req.ParticipantID)
	if err != nil {
		serverError(w, err)
		return
	}

	jsonResponse(w, http.StatusOK, map[string]any{
		"dmID": dmID,
	})
}
