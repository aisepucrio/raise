// Package jobkit contains the conventions every job in the system follows:
// how errors map to River outcomes, how follow-up jobs are enqueued (and
// counted towards a collection's progress), and uniqueness rules.
package jobkit

import (
	"errors"
	"fmt"
	"math/rand/v2"
	"time"

	"github.com/riverqueue/river"
)

// RateLimitedError means no credential has quota left until ResetAt. Jobs
// returning it are snoozed (not failed) until the quota window resets.
type RateLimitedError struct {
	Platform string
	ResetAt  time.Time
}

func (e *RateLimitedError) Error() string {
	return fmt.Sprintf("%s: rate limited until %s", e.Platform, e.ResetAt.Format(time.RFC3339))
}

// ErrNoCredential means the platform has no usable credential at all (none
// configured, or all invalid). Jobs returning it are cancelled: retrying
// can't help until an admin adds a token.
var ErrNoCredential = errors.New("no usable credential")

// ErrPermanent marks failures that retries can't fix (404, malformed input).
var ErrPermanent = errors.New("permanent failure")

const maxSnooze = 2 * time.Hour

// MapError translates domain errors into River's control-flow errors.
func MapError(err error) error {
	if err == nil {
		return nil
	}
	var rl *RateLimitedError
	switch {
	case errors.As(err, &rl):
		wait := time.Until(rl.ResetAt)
		// Jitter so all snoozed jobs don't stampede at the reset instant.
		wait += time.Duration(rand.Int64N(int64(10 * time.Second)))
		return river.JobSnooze(min(max(wait, time.Second), maxSnooze))
	case errors.Is(err, ErrNoCredential), errors.Is(err, ErrPermanent):
		return river.JobCancel(err)
	}
	return err
}

func isSnooze(err error) bool {
	var s *river.JobSnoozeError
	return errors.As(err, &s)
}

func isCancel(err error) bool {
	var c *river.JobCancelError
	return errors.As(err, &c)
}
