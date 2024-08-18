package main

import (
	"backend/types"
	"context"
	"errors"
	"log"
	"net/http"
)

type Middleware func(http.Handler) http.Handler

func createStack(xs ...Middleware) Middleware {
	return func(next http.Handler) http.Handler {
		for i := len(xs) - 1; i >= 0; i-- {
			x := xs[i]
			next = x(next)
		}
		return next
	}
}

func (app *application) enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("origin")

		if origin == app.conf.RedirectURL {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (app *application) authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie("session")
		if err != nil || c.Value == "" {
			next.ServeHTTP(w, r)
			return
		}

		user, err := app.repo.GetUserFromSession(context.Background(), c.Value)
		if err != nil {
			log.Printf("failed to get user from session: %v\n", err)
			next.ServeHTTP(w, r)
			return
		}

		ctx := context.WithValue(r.Context(), "user", user)
		req := r.WithContext(ctx)
		next.ServeHTTP(w, req)
	})
}

func (app *application) isAuthenticated(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		v := r.Context().Value("user")

		if _, ok := v.(*types.User); !ok {
			err := errors.New("failed to get user from context")
			unauthRequest(w, err)
			return
		}

		next.ServeHTTP(w, r)
	})
}
