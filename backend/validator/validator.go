package validator

import (
	"encoding/json"
	"fmt"
	"strings"
)

type Validator struct {
	Errors map[string]string
}

func NewValidator() *Validator {
	return &Validator{
		Errors: make(map[string]string),
	}
}

func (v *Validator) Count(key string, value *string, op string, count int) *Validator {
	*value = strings.Trim(*value, " ")
	switch op {
	case "min":
		if len(*value) < count {
			v.Errors[key] = fmt.Sprintf("should be minimum of %d characters", count)
		}
	case "max":
		if len(*value) > count {
			v.Errors[key] = fmt.Sprintf("should be maximum of %d characters", count)
		}
	}
	return v
}

func (v *Validator) IsInStr(key string, value *string, values []string) *Validator {
	*value = strings.Trim(*value, " ")
	if !isIn(*value, values) {
		v.Errors[key] = fmt.Sprintf("%q is not allowed", *value)
	}
	return v
}

func (v *Validator) IsInInt(key string, value int, values []int) *Validator {
	if !isIn(value, values) {
		v.Errors[key] = fmt.Sprintf("%d is not allowed", value)
	}
	return v
}

func (v *Validator) IsValid() bool {
	return len(v.Errors) == 0
}

func (v *Validator) Error() string {
	b, err := json.Marshal(v.Errors)
	if err != nil {
		return fmt.Sprintf("failed to marshal validator errors: %v", err)
	}
	return string(b)
}

func isIn[T int | string](value T, values []T) bool {
	for _, item := range values {
		if value == item {
			return true
		}
	}
	return false
}
