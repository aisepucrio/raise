package github

import (
	"encoding/json"
	"strings"
	"testing"
)

// A pull request as returned by queryFetchPullRequests, trimmed to the fields
// store.go maps. Comments and commits have further pages; one review is pending.
const pullRequestFixture = `{
  "id": "PR_1", "fullDatabaseId": "3000000001", "number": 42, "title": "Add flag", "state": "MERGED",
  "body": "", "url": "https://github.com/o/r/pull/42", "locked": false,
  "author": {"login": "alice"}, "authorAssociation": "CONTRIBUTOR", "milestone": {"title": "v1"},
  "createdAt": "2024-01-01T00:00:00Z", "updatedAt": "2024-01-03T00:00:00Z", "closedAt": "2024-01-02T00:00:00Z",
  "labels": {"nodes": [{"name": "feature"}]}, "assignees": {"nodes": [{"login": "bob"}]},
  "reactionGroups": [{"content": "THUMBS_UP", "reactors": {"totalCount": 2}}, {"content": "EYES", "reactors": {"totalCount": 0}}],
  "comments": {"totalCount": 101, "pageInfo": {"hasNextPage": true, "endCursor": "C1"}, "nodes": [
    {"id": "IC_1", "fullDatabaseId": "2500000000", "author": null, "authorAssociation": "NONE", "body": "hi",
     "createdAt": "2024-01-01T01:00:00Z", "updatedAt": "2024-01-01T01:00:00Z",
     "reactionGroups": [{"content": "HEART", "reactors": {"totalCount": 1}}]}]},
  "isDraft": false, "merged": true, "mergedAt": "2024-01-02T00:00:00Z", "mergedBy": {"login": "carol"},
  "headRefName": "feat", "headRefOid": "aaaa", "headRepository": null,
  "baseRefName": "main", "baseRefOid": "bbbb", "mergeCommit": {"oid": "cccc"},
  "changedFiles": 3, "additions": 10, "deletions": 2,
  "reviewRequests": {"nodes": [{"requestedReviewer": {"__typename": "User", "login": "dave"}},
                               {"requestedReviewer": {"__typename": "Team", "combinedSlug": "o/core"}}]},
  "timelineItems": {"pageInfo": {"hasNextPage": false, "endCursor": "T1"}, "nodes": [
    {"__typename": "MergedEvent", "id": "ME_1", "actor": {"login": "carol"}, "createdAt": "2024-01-02T00:00:00Z",
     "mergeRefName": "main", "commit": {"oid": "cccc"}},
    {"__typename": "HeadRefForcePushedEvent", "id": "HRFPE_1", "actor": {"login": "alice"}, "createdAt": "2024-01-01T12:00:00Z",
     "ref": null, "beforeCommit": {"oid": "dddd"}, "afterCommit": {"oid": "aaaa"}},
    {"__typename": "SomeFutureEvent", "id": "X_1"}]},
  "commits": {"totalCount": 101, "pageInfo": {"hasNextPage": true, "endCursor": "K1"}, "nodes": [
    {"commit": {"oid": "1111"}}, {"commit": {"oid": "aaaa"}}]},
  "reviews": {"totalCount": 2, "pageInfo": {"hasNextPage": false, "endCursor": "R1"}, "nodes": [
    {"id": "PRR_1", "fullDatabaseId": "4000000001", "author": {"login": "dave"}, "authorAssociation": "MEMBER",
     "state": "APPROVED", "body": "", "commit": {"oid": "aaaa"},
     "submittedAt": "2024-01-01T20:00:00Z", "updatedAt": "2024-01-01T20:00:00Z"},
    {"id": "PRR_2", "fullDatabaseId": "4000000002", "author": {"login": "erin"}, "authorAssociation": "MEMBER",
     "state": "PENDING", "body": "", "commit": null, "submittedAt": null, "updatedAt": "2024-01-01T21:00:00Z"}]},
  "reviewThreads": {"totalCount": 1, "pageInfo": {"hasNextPage": false, "endCursor": "TH1"}, "nodes": [
    {"id": "PRRT_1", "reviewComments": {"pageInfo": {"hasNextPage": true, "endCursor": "RC1"}, "nodes": [
      {"id": "PRRC_1", "fullDatabaseId": "1900000001", "author": {"login": "dave"}, "authorAssociation": "MEMBER",
       "body": "nit", "path": "main.go", "line": null, "originalLine": 7, "diffHunk": "@@ -1 +1 @@",
       "commit": {"oid": "aaaa"}, "pullRequestReview": {"fullDatabaseId": "4000000001"}, "replyTo": null,
       "createdAt": "2024-01-01T20:00:00Z", "updatedAt": "2024-01-01T20:00:00Z"}]}}]}
}`

func TestBatchMapsPullRequest(t *testing.T) {
	var n node[gqlPullRequest]
	if err := json.Unmarshal([]byte(pullRequestFixture), &n); err != nil {
		t.Fatal(err)
	}
	b := &batch{repoID: 7}
	b.addPullRequest(n)
	if b.err != nil {
		t.Fatal(b.err)
	}

	if len(b.issues) != 1 || len(b.pullRequests) != 1 {
		t.Fatalf("issues=%d pull requests=%d", len(b.issues), len(b.pullRequests))
	}
	is := b.issues[0]
	if !is.IsPullRequest || is.State != "closed" || is.GithubID != 3000000001 || is.Body != nil ||
		*is.MilestoneTitle != "v1" || is.CommentCount != 101 || string(is.ReactionCounts) != `{"+1":2}` {
		t.Errorf("issue row = %+v", is)
	}
	for _, k := range nestedConnections {
		if strings.Contains(string(is.RawPayload), `"`+k+`"`) {
			t.Errorf("raw_payload still contains %q", k)
		}
	}
	if !strings.Contains(string(is.RawPayload), `"url"`) {
		t.Error("raw_payload lost unmodelled fields")
	}

	pr := b.pullRequests[0]
	if pr.State != "closed" || !pr.IsMerged || *pr.MergedByLogin != "carol" || pr.HeadRepositoryFullName != nil ||
		*pr.MergeCommitSha != "cccc" || pr.CommitCount != 101 || pr.ReviewThreadCount != 1 ||
		len(pr.RequestedReviewerLogins) != 1 || pr.RequestedReviewerLogins[0] != "dave" {
		t.Errorf("pull request row = %+v", pr)
	}
	if len(b.commitTrims) != 1 || b.commitTrims[0].CommitCount != 101 {
		t.Errorf("commit trims = %+v", b.commitTrims)
	}

	if len(b.comments) != 1 || b.comments[0].GithubID != 2500000000 || b.comments[0].AuthorLogin != nil ||
		b.comments[0].IssueNumber != 42 || string(b.comments[0].ReactionCounts) != `{"heart":1}` {
		t.Errorf("comments = %+v", b.comments)
	}

	if len(b.events) != 2 {
		t.Fatalf("events = %+v (unknown types must be skipped)", b.events)
	}
	if e := b.events[0]; e.EventType != "merged" || *e.CommitSha != "cccc" {
		t.Errorf("merged event = %+v", e)
	}
	if e := b.events[1]; e.EventType != "head_ref_force_pushed" || *e.CommitSha != "aaaa" {
		t.Errorf("force-push event = %+v", e)
	}

	if len(b.commits) != 2 || b.commits[1].Position != 1 || b.commits[1].Sha != "aaaa" {
		t.Errorf("commits = %+v", b.commits)
	}
	if len(b.reviews) != 1 || b.reviews[0].State != "approved" || b.reviews[0].GithubID != 4000000001 {
		t.Errorf("reviews = %+v (pending reviews must be skipped)", b.reviews)
	}
	if len(b.reviewComments) != 1 {
		t.Fatalf("review comments = %+v", b.reviewComments)
	}
	if rc := b.reviewComments[0]; rc.ThreadGithubNodeID != "PRRT_1" || *rc.ReviewGithubID != 4000000001 ||
		rc.InReplyToGithubID != nil || rc.Line != nil || *rc.OriginalLine != 7 || rc.PullRequestNumber != 42 {
		t.Errorf("review comment = %+v", rc)
	}

	// Continuations: comments and commits of the PR, comments of the thread.
	want := map[string]FetchConnectionArgs{
		ConnIssueComments:      {RepositoryID: 7, Connection: ConnIssueComments, NodeID: "PR_1", Cursor: "C1"},
		ConnPullRequestCommits: {RepositoryID: 7, Connection: ConnPullRequestCommits, NodeID: "PR_1", Cursor: "K1", Offset: 2},
		ConnThreadComments:     {RepositoryID: 7, Connection: ConnThreadComments, NodeID: "PRRT_1", Cursor: "RC1"},
	}
	if len(b.jobs) != len(want) {
		t.Fatalf("jobs = %+v", b.jobs)
	}
	for _, j := range b.jobs {
		a, ok := j.Args.(FetchConnectionArgs)
		if !ok || want[a.Connection] != a {
			t.Errorf("unexpected job %+v", j.Args)
		}
	}
}

func TestBatchMapsIssue(t *testing.T) {
	var n node[gqlIssue]
	err := json.Unmarshal([]byte(`{
	  "id": "I_1", "fullDatabaseId": "2600000000", "number": 5, "title": "Bug", "state": "CLOSED",
	  "stateReason": "NOT_PLANNED", "body": "text", "locked": true, "author": {"login": "alice"},
	  "authorAssociation": "NONE", "milestone": null,
	  "createdAt": "2024-01-01T00:00:00Z", "updatedAt": "2024-01-02T00:00:00Z", "closedAt": "2024-01-02T00:00:00Z",
	  "labels": {"nodes": []}, "assignees": {"nodes": []}, "reactionGroups": [],
	  "comments": {"totalCount": 0, "pageInfo": {"hasNextPage": false, "endCursor": null}, "nodes": []},
	  "timelineItems": {"pageInfo": {"hasNextPage": true, "endCursor": "T1"}, "nodes": [
	    {"__typename": "ClosedEvent", "id": "CE_1", "actor": {"login": "bob"}, "createdAt": "2024-01-02T00:00:00Z",
	     "stateReason": "NOT_PLANNED", "closer": {"__typename": "Commit", "oid": "abcd"}}]}
	}`), &n)
	if err != nil {
		t.Fatal(err)
	}
	b := &batch{repoID: 1}
	b.addIssue(n)

	is := b.issues[0]
	if is.IsPullRequest || *is.StateReason != "not_planned" || !is.IsLocked || is.MilestoneTitle != nil ||
		*is.Body != "text" || string(is.ReactionCounts) != `{}` {
		t.Errorf("issue row = %+v", is)
	}
	if len(b.events) != 1 || b.events[0].EventType != "closed" || *b.events[0].CommitSha != "abcd" {
		t.Errorf("events = %+v", b.events)
	}
	if len(b.jobs) != 1 || b.jobs[0].Args.(FetchConnectionArgs).Connection != ConnTimelineItems {
		t.Errorf("jobs = %+v", b.jobs)
	}
}

func TestEveryConnectionHasAQuery(t *testing.T) {
	for _, c := range []string{ConnIssueComments, ConnTimelineItems, ConnPullRequestCommits,
		ConnPullRequestReviews, ConnReviewThreads, ConnThreadComments} {
		if connectionQueries[c] == "" {
			t.Errorf("no query for connection %q", c)
		}
	}
	if len(eventTypes) != len(pullRequestTimelineEvents) {
		t.Error("duplicate __typename in the timeline event tables")
	}
}
