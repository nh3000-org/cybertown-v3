package http

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type apiError struct {
	statusCode int
	message    any
}

func (e *apiError) Error() string {
	return fmt.Sprintf("api error: status code: %d", e.statusCode)
}

func jsonResponse(w http.ResponseWriter, statusCode int, data any) {
	w.Header().Add("content-type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}
