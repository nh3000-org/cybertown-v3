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

func Filter(slice []int, callback func(int) bool) []int {
	var result []int
	for _, value := range slice {
		if callback(value) {
			result = append(result, value)
		}
	}
	return result
}

func KeyOf[K any](input map[int]K) []int {
	var result []int
	for k := range input {
		result = append(result, k)
	}
	return result
}
