package main

import (
	"encoding/json"
	"log"
	"net/http"
)

func jsonResponse(w http.ResponseWriter, statusCode int, data any) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func errorResponse(w http.ResponseWriter, statusCode int, err error) {
	if err != nil {
		log.Println(err)
	}
	jsonResponse(w, statusCode, map[string]string{
		"error": http.StatusText(statusCode),
	})
}

func badRequest(w http.ResponseWriter, err error) {
	errorResponse(w, http.StatusBadRequest, err)
}

func serverError(w http.ResponseWriter, err error) {
	errorResponse(w, http.StatusInternalServerError, err)
}

func unauthRequest(w http.ResponseWriter, err error) {
	errorResponse(w, http.StatusUnauthorized, err)
}

func msgResponse(w http.ResponseWriter, msg string) {
	jsonResponse(w, http.StatusOK, map[string]string{
		"message": msg,
	})
}
