package httpapi

import (
	"errors"
	"log/slog"

	"github.com/danielgtaylor/huma/v2"

	"raise/internal/apperr"
)

// Error maps domain errors to huma status errors. Handlers return
// httpapi.Error(err) instead of choosing status codes themselves.
func Error(err error) error {
	if err == nil {
		return nil
	}
	var se huma.StatusError
	if errors.As(err, &se) {
		return err
	}
	msg := err.Error()
	switch {
	case errors.Is(err, apperr.ErrNotFound):
		return huma.Error404NotFound(msg)
	case errors.Is(err, apperr.ErrInvalid):
		return huma.Error422UnprocessableEntity(msg)
	case errors.Is(err, apperr.ErrConflict):
		return huma.Error409Conflict(msg)
	case errors.Is(err, apperr.ErrUnauthorized):
		return huma.Error401Unauthorized(msg)
	case errors.Is(err, apperr.ErrForbidden):
		return huma.Error403Forbidden(msg)
	case errors.Is(err, apperr.ErrNotImplemented):
		return huma.Error501NotImplemented(msg)
	}
	slog.Error("unhandled error", "error", err)
	return huma.Error500InternalServerError("internal error")
}

// Page is the common pagination input.
type Page struct {
	Limit  int32 `query:"limit" minimum:"1" maximum:"1000" default:"100"`
	Offset int32 `query:"offset" minimum:"0" default:"0"`
}
