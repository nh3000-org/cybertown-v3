package utils

import (
	"strings"
)

func Includes[T string | int](input []T, value T) bool {
	for _, v := range input {
		if v == value {
			return true
		}
	}
	return false
}

func ReplaceAfter(s, v, with string) string {
	index := strings.Index(s, v)
	if index == -1 {
		return s
	}
	return s[:index] + with
}

func Filter[T string | int](slice []T, callback func(T) bool) []T {
	var result []T
	for _, value := range slice {
		if callback(value) {
			result = append(result, value)
		}
	}
	return result
}
