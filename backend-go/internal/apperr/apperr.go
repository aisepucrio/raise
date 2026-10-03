// Package apperr defines the sentinel errors shared across domain packages.
// Domain code wraps them (fmt.Errorf("%w: ...", apperr.ErrInvalid)); the HTTP
// layer maps them to status codes in one place (httpapi.Error).
package apperr

import "errors"

var (
	ErrNotFound       = errors.New("not found")
	ErrInvalid        = errors.New("invalid request")
	ErrConflict       = errors.New("conflict")
	ErrUnauthorized   = errors.New("unauthorized")
	ErrForbidden      = errors.New("forbidden")
	ErrNotImplemented = errors.New("not implemented")
)
