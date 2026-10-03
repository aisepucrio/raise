package jobkit

import (
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/rivertype"
)

// UniqueInFlight deduplicates jobs with identical args while one is queued or
// running, but allows the same work to run again once it has completed (River's
// default would block re-runs until completed jobs are cleaned up).
func UniqueInFlight() river.UniqueOpts {
	return river.UniqueOpts{
		ByArgs: true,
		ByState: []rivertype.JobState{
			rivertype.JobStateAvailable,
			rivertype.JobStatePending,
			rivertype.JobStateRetryable,
			rivertype.JobStateRunning,
			rivertype.JobStateScheduled,
		},
	}
}
