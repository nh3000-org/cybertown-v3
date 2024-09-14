package http

import (
	"log"
	"net/http"
)

type apiFunc func(w http.ResponseWriter, r *http.Request) error

func errorHandler(next apiFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := next(w, r); err != nil {
			if e, ok := err.(*apiError); ok {
				jsonResponse(w, e.statusCode, e.message)
			} else {
				log.Printf("error handler: %v", err)
				jsonResponse(w, http.StatusInternalServerError, map[string]any{
					"error": http.StatusText(http.StatusInternalServerError),
				})
			}
		}
	})
}
