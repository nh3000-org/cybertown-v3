package http

import "net/http"

func registerUserRoutes(mux *http.ServeMux) {
	mux.Handle("/login", errorHandler(loginHandler))
	mux.Handle("/logout", errorHandler(logoutHandler))
	mux.Handle("/me", errorHandler(meHandler))
}

func loginHandler(w http.ResponseWriter, r *http.Request) error {
	return nil
}

func logoutHandler(w http.ResponseWriter, r *http.Request) error {
	return nil
}

func meHandler(w http.ResponseWriter, r *http.Request) error {
	return nil
}
