package github

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"slices"
	"strconv"
	"strings"
	"testing"
	"time"

	"raise/internal/jobkit"
	"raise/internal/platform"
	"raise/internal/platform/git"
)

// ---- client.go ----

type fakeLease struct {
	id          int64
	reported    []platform.Quota
	invalidated bool
}

func (l *fakeLease) Credential() platform.Credential {
	return platform.Credential{ID: l.id, Secret: map[string]string{"token": "t" + strconv.FormatInt(l.id, 10)}}
}
func (l *fakeLease) Report(_ context.Context, q platform.Quota) error {
	l.reported = append(l.reported, q)
	return nil
}
func (l *fakeLease) Invalidate(context.Context, string) error { l.invalidated = true; return nil }

type fakeLeaser struct {
	leases []*fakeLease
	scopes []string
}

func (f *fakeLeaser) Lease(_ context.Context, _ platform.ID, scope string) (platform.Lease, error) {
	l := &fakeLease{id: int64(len(f.leases) + 1)}
	f.leases = append(f.leases, l)
	f.scopes = append(f.scopes, scope)
	return l, nil
}

// graphqlServer answers every request with handler, after checking it is a
// GraphQL POST.
func graphqlServer(t *testing.T, handler http.HandlerFunc) *Client {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/graphql" {
			t.Errorf("unexpected request %s %s", r.Method, r.URL.Path)
		}
		handler(w, r)
	}))
	t.Cleanup(srv.Close)
	return NewClient(srv.Client(), srv.URL, srv.URL+"/graphql", &fakeLeaser{})
}

func quotaHeaders(w http.ResponseWriter, remaining int) {
	w.Header().Set("X-RateLimit-Limit", "5000")
	w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(remaining))
	w.Header().Set("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(time.Hour).Unix(), 10))
	w.Header().Set("X-RateLimit-Resource", "graphql")
}

func TestQueryRotatesOnRejectedAndExhaustedTokens(t *testing.T) {
	c := graphqlServer(t, func(w http.ResponseWriter, r *http.Request) {
		switch r.Header.Get("Authorization") {
		case "Bearer t1":
			quotaHeaders(w, 10)
			w.WriteHeader(http.StatusUnauthorized)
		case "Bearer t2":
			// Primary GraphQL limit: HTTP 200 with a RATE_LIMITED error.
			quotaHeaders(w, 0)
			_, _ = w.Write([]byte(`{"data": null, "errors": [{"type": "RATE_LIMITED", "message": "API rate limit exceeded"}]}`))
		default:
			quotaHeaders(w, 4990)
			_, _ = w.Write([]byte(`{"data": {"viewer": {"login": "octocat"}}}`))
		}
	})
	leaser := c.leaser.(*fakeLeaser)

	var out struct {
		Viewer struct{ Login string } `json:"viewer"`
	}
	if err := c.Query(context.Background(), "{ viewer { login } }", nil, &out); err != nil {
		t.Fatal(err)
	}
	if out.Viewer.Login != "octocat" {
		t.Fatalf("out = %+v", out)
	}
	if len(leaser.leases) != 3 || !leaser.leases[0].invalidated || leaser.leases[1].invalidated {
		t.Fatalf("unexpected lease usage: %+v", leaser.leases)
	}
	if leaser.scopes[0] != ScopeGraphQL {
		t.Fatalf("leased scope %q, want %q", leaser.scopes[0], ScopeGraphQL)
	}
	if q := leaser.leases[2].reported[0]; q.RequestsRemaining != 4990 || q.Scope != ScopeGraphQL {
		t.Fatalf("reported quota = %+v", q)
	}
}

func TestQuerySecondaryRateLimitSnoozes(t *testing.T) {
	for name, h := range map[string]http.HandlerFunc{
		"retry-after": func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Retry-After", "60")
			w.WriteHeader(http.StatusForbidden)
		},
		"message only": func(w http.ResponseWriter, _ *http.Request) {
			quotaHeaders(w, 4000)
			w.WriteHeader(http.StatusForbidden)
			_, _ = w.Write([]byte(`{"message": "You have exceeded a secondary rate limit."}`))
		},
		"graphql error": func(w http.ResponseWriter, _ *http.Request) {
			quotaHeaders(w, 4000)
			_, _ = w.Write([]byte(`{"errors": [{"type": "RATE_LIMITED", "message": "secondary"}]}`))
		},
	} {
		t.Run(name, func(t *testing.T) {
			err := graphqlServer(t, h).Query(context.Background(), "{}", nil, &struct{}{})
			var rl *jobkit.RateLimitedError
			if !errors.As(err, &rl) || time.Until(rl.ResetAt) < 50*time.Second {
				t.Fatalf("err = %v, want RateLimitedError ~60s", err)
			}
		})
	}
}

func TestQueryToleratesPartialNotFound(t *testing.T) {
	c := graphqlServer(t, func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"data": {"nodes": [null, {"id": "I_2"}]},
			"errors": [{"type": "NOT_FOUND", "path": ["nodes", 0], "message": "Could not resolve to a node"}]}`))
	})
	var out struct {
		Nodes []*struct{ ID string } `json:"nodes"`
	}
	if err := c.Query(context.Background(), "{}", nil, &out); err != nil {
		t.Fatal(err)
	}
	if len(out.Nodes) != 2 || out.Nodes[0] != nil || out.Nodes[1].ID != "I_2" {
		t.Fatalf("out = %+v", out)
	}
}

func TestQueryErrorClassification(t *testing.T) {
	cases := map[string]struct {
		status int
		body   string
		want   error
	}{
		"gateway timeout": {http.StatusBadGateway, ``, ErrQueryTimeout},
		"query timeout": {http.StatusOK, `{"data": null, "errors": [{"message": "Something went wrong while executing your query. This may be the result of a timeout, or it could be a GitHub bug."}]}`,
			ErrQueryTimeout},
		"resource limits": {http.StatusOK, `{"data": {"nodes": [{"releaseAssets": {"nodes": [null]}}]}, "errors": [{"type": "RESOURCE_LIMITS_EXCEEDED", "path": ["nodes", 0, "releaseAssets", "nodes", 0, "id"], "message": "Resource limits for this query exceeded."}]}`,
			ErrQueryTimeout},
		"forbidden":     {http.StatusOK, `{"data": {"repository": null}, "errors": [{"type": "FORBIDDEN", "path": ["repository"], "message": "SAML enforcement"}]}`, jobkit.ErrPermanent},
		"forbidden 403": {http.StatusForbidden, `{"message": "Resource not accessible"}`, jobkit.ErrPermanent},
	}
	for name, tc := range cases {
		t.Run(name, func(t *testing.T) {
			c := graphqlServer(t, func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(tc.status)
				_, _ = w.Write([]byte(tc.body))
			})
			if err := c.Query(context.Background(), "{}", nil, &struct{}{}); !errors.Is(err, tc.want) {
				t.Fatalf("err = %v, want %v", err, tc.want)
			}
		})
	}

	t.Run("invalid query is retryable", func(t *testing.T) {
		c := graphqlServer(t, func(w http.ResponseWriter, _ *http.Request) {
			_, _ = w.Write([]byte(`{"errors": [{"message": "Field 'x' doesn't exist on type 'Query'"}]}`))
		})
		err := c.Query(context.Background(), "{ x }", nil, &struct{}{})
		var gerr *GraphQLError
		if !errors.As(err, &gerr) || errors.Is(err, jobkit.ErrPermanent) {
			t.Fatalf("err = %v, want a non-permanent GraphQLError", err)
		}
	})
}

func TestGetREST(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		quotaHeaders(w, 4000)
		switch r.URL.EscapedPath() {
		case "/users/dependabot%5Bbot%5D":
			_, _ = w.Write([]byte(`{"id": 49699333, "login": "dependabot[bot]", "type": "Bot"}`))
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	t.Cleanup(srv.Close)
	leaser := &fakeLeaser{}
	c := NewClient(srv.Client(), srv.URL, srv.URL+"/graphql", leaser)

	var u restUser
	found, err := c.Get(context.Background(), "/users/"+url.PathEscape("dependabot[bot]"), &u)
	if err != nil || !found || u.ID != 49699333 || u.Type != "Bot" {
		t.Fatalf("Get = %v, %v, %+v", found, err, u)
	}
	if leaser.scopes[0] != ScopeCore {
		t.Errorf("leased scope %q, want %q", leaser.scopes[0], ScopeCore)
	}
	if found, err := c.Get(context.Background(), "/users/gone", &u); err != nil || found {
		t.Errorf("Get of a missing user = %v, %v", found, err)
	}
}

func TestGraphQLURLFor(t *testing.T) {
	for in, want := range map[string]string{
		"https://api.github.com":              "https://api.github.com/graphql",
		"https://api.github.com/":             "https://api.github.com/graphql",
		"https://github.example.com/api/v3":   "https://github.example.com/api/graphql",
		"https://github.example.com/api/v3/":  "https://github.example.com/api/graphql",
		"http://localhost:8080/custom-prefix": "http://localhost:8080/custom-prefix/graphql",
	} {
		if got := graphqlURLFor(in); got != want {
			t.Errorf("graphqlURLFor(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestMatchRemote(t *testing.T) {
	p := &Platform{cfg: Config{Hosts: []string{"github.com"}}}
	if ref, ok := p.MatchRemote("github.com", "golang/go"); !ok || ref.Owner != "golang" || ref.Name != "go" {
		t.Errorf("MatchRemote = %+v, %v", ref, ok)
	}
	for _, c := range [][2]string{{"gitlab.com", "a/b"}, {"github.com", "a/b/c"}, {"github.com", "a"}} {
		if _, ok := p.MatchRemote(c[0], c[1]); ok {
			t.Errorf("MatchRemote(%q, %q) should not match", c[0], c[1])
		}
	}
}

func TestOnCommitsMinedOnlyWhenRequested(t *testing.T) {
	p := &Platform{}
	repo := git.Repository{ID: 3}
	ref := git.RepoRef{Platform: ID, Owner: "o", Name: "r"}
	shas := make([]string, commitBatchSize+1)
	for i := range shas {
		shas[i] = fmt.Sprintf("%040d", i)
	}

	if jobs := p.OnCommitsMined(repo, ref, git.EnrichRequest{Resources: []string{ResourceIssues}}, shas); len(jobs) != 0 {
		t.Errorf("commits not requested, got %d jobs", len(jobs))
	}
	jobs := p.OnCommitsMined(repo, ref, git.EnrichRequest{Resources: []string{ResourceCommits}}, shas)
	if len(jobs) != 2 {
		t.Fatalf("jobs = %d, want 2", len(jobs))
	}
	a := jobs[1].Args.(FetchCommitsArgs)
	if a.RepositoryID != 3 || a.Owner != "o" || a.Name != "r" || len(a.SHAs) != 1 || a.SHAs[0] != shas[commitBatchSize] || a.Users {
		t.Errorf("second batch = %+v", a)
	}
	jobs = p.OnCommitsMined(repo, ref, git.EnrichRequest{Resources: []string{ResourceCommits, ResourceUsers}}, shas)
	if !jobs[0].Args.(FetchCommitsArgs).Users {
		t.Error("users requested, but FetchCommits doesn't fetch them")
	}
}

func TestInCreationWindow(t *testing.T) {
	day := func(d int) time.Time { return time.Date(2024, 1, d, 0, 0, 0, 0, time.UTC) }
	page := []issueID{{"a", day(1)}, {"b", day(2)}, {"c", day(3)}, {"d", day(4)}}
	created := func(n issueID) time.Time { return n.CreatedAt }
	ids := func(ns []issueID) string {
		var out string
		for _, n := range ns {
			out += n.ID
		}
		return out
	}
	since, until := day(2), day(4)
	cases := []struct {
		name         string
		since, until *time.Time
		want         string
		past         bool
	}{
		{"open", nil, nil, "abcd", false},
		{"since is inclusive", &since, nil, "bcd", false},
		{"until is exclusive and stops the listing", nil, &until, "abc", true},
		{"both", &since, &until, "bc", true},
	}
	for _, c := range cases {
		kept, past := inCreationWindow(page, created, c.since, c.until)
		if ids(kept) != c.want || past != c.past {
			t.Errorf("%s: got %q past=%v, want %q past=%v", c.name, ids(kept), past, c.want, c.past)
		}
	}
	// A page entirely before since keeps nothing but goes on listing.
	late := day(10)
	if kept, past := inCreationWindow(page, created, &late, nil); len(kept) != 0 || past {
		t.Errorf("page before since: kept %d, past=%v", len(kept), past)
	}
}

// ---- store.go ----

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
                               {"requestedReviewer": {"__typename": "Team", "combinedSlug": "o/core"}},
                               {"requestedReviewer": {"__typename": "Bot", "login": "copilot-pull-request-reviewer"}}]},
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
		!slices.Equal(pr.RequestedReviewerLogins, []string{"dave", "copilot-pull-request-reviewer[bot]"}) {
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

	logins := b.logins()
	slices.Sort(logins)
	if want := []string{"alice", "alice", "bob", "carol", "carol", "copilot-pull-request-reviewer[bot]", "dave", "dave", "dave"}; !slices.Equal(logins, want) {
		t.Errorf("logins = %v, want %v", logins, want)
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

func TestRepositoryRow(t *testing.T) {
	var n node[gqlRepository]
	err := json.Unmarshal([]byte(`{
	  "id": "R_1", "databaseId": 100, "nameWithOwner": "spf13/cobra", "description": "",
	  "owner": {"__typename": "User", "login": "spf13"},
	  "defaultBranchRef": {"name": "main"}, "primaryLanguage": {"name": "Go"},
	  "languages": {"edges": [{"size": 300, "node": {"name": "Go"}}, {"size": 5, "node": {"name": "Makefile"}}]},
	  "repositoryTopics": {"nodes": [{"topic": {"name": "cli"}}]},
	  "licenseInfo": {"spdxId": "Apache-2.0"}, "visibility": "PUBLIC", "parent": null,
	  "stargazerCount": 40000, "forkCount": 3000, "watchers": {"totalCount": 350},
	  "labels": {"totalCount": 27}, "releases": {"totalCount": 31},
	  "openIssues": {"totalCount": 200}, "openPullRequests": {"totalCount": 90},
	  "createdAt": "2013-09-03T00:00:00Z", "updatedAt": "2024-01-02T00:00:00Z", "pushedAt": null
	}`), &n)
	if err != nil {
		t.Fatal(err)
	}
	r, err := repositoryRow(1, n)
	if err != nil {
		t.Fatal(err)
	}
	if r.OwnerLogin != "spf13" || r.OwnerType != "User" || r.LabelCount != 27 || r.ReleaseCount != 31 ||
		r.WatcherCount != 350 || r.Visibility != "public" || r.Description != nil || *r.DefaultBranch != "main" ||
		*r.LicenseSpdxID != "Apache-2.0" || len(r.TopicNames) != 1 || string(r.LanguageBytes) != `{"Go":300,"Makefile":5}` {
		t.Errorf("repository row = %+v", r)
	}
}

// The repository object of a queryFetchCommits response for three SHAs: the
// second is unknown to GitHub, the third was also proposed by a fork's pull
// request.
const commitsFixture = `{
  "databaseId": 100,
  "c0": {"id": "C_1", "oid": "aaaa", "url": "https://github.com/o/r/commit/aaaa",
         "author": {"user": {"login": "alice"}}, "committer": {"user": {"login": "web-flow"}},
         "signature": {"isValid": true, "state": "VALID", "wasSignedByGitHub": true, "signer": {"login": "web-flow"}},
         "associatedPullRequests": {"totalCount": 1, "nodes": [{"number": 42, "baseRepository": {"databaseId": 100}}]}},
  "c1": null,
  "c2": {"id": "C_3", "oid": "cccc", "url": "https://github.com/o/r/commit/cccc",
         "author": {"user": null}, "committer": {"user": null}, "signature": null,
         "associatedPullRequests": {"totalCount": 2, "nodes": [
           {"number": 7, "baseRepository": {"databaseId": 100}},
           {"number": 9, "baseRepository": {"databaseId": 200}}]}}
}`

func TestCommitBatchFrom(t *testing.T) {
	var repo map[string]json.RawMessage
	if err := json.Unmarshal([]byte(commitsFixture), &repo); err != nil {
		t.Fatal(err)
	}
	b, err := commitBatchFrom(5, repo, []string{"aaaa", "bbbb", "cccc"})
	if err != nil {
		t.Fatal(err)
	}
	if len(b.commits) != 2 {
		t.Fatalf("commits = %+v (missing commits must be skipped)", b.commits)
	}
	if c := b.commits[0]; c.Sha != "aaaa" || c.GithubNodeID != "C_1" || *c.AuthorLogin != "alice" ||
		*c.CommitterLogin != "web-flow" || !c.IsSignatureVerified {
		t.Errorf("first commit = %+v", c)
	}
	if c := b.commits[1]; c.AuthorLogin != nil || c.CommitterLogin != nil || c.IsSignatureVerified {
		t.Errorf("unlinked, unsigned commit = %+v", c)
	}
	raw := string(b.commits[0].RawPayload)
	if strings.Contains(raw, "associatedPullRequests") || !strings.Contains(raw, `"url"`) {
		t.Errorf("raw_payload = %s", raw)
	}
	// The fork's pull request (#9) is not this repository's.
	if !slices.Equal(b.prShas, []string{"aaaa", "cccc"}) || !slices.Equal(b.prNumbers, []int32{42, 7}) {
		t.Errorf("pull request links = %v %v", b.prShas, b.prNumbers)
	}
}

// A release as returned by queryListReleases.
const releaseFixture = `{
  "id": "RE_1", "databaseId": 150000001, "tagName": "v1.2.0", "name": "", "description": "Notes",
  "url": "https://github.com/o/r/releases/tag/v1.2.0", "isDraft": false, "isPrerelease": true, "isLatest": false,
  "immutable": false, "author": {"login": "alice"}, "tagCommit": {"oid": "aaaa"},
  "reactionGroups": [{"content": "HOORAY", "reactors": {"totalCount": 3}}],
  "createdAt": "2024-01-01T00:00:00Z", "updatedAt": "2024-01-02T00:00:00Z", "publishedAt": "2024-01-01T01:00:00Z",
  "releaseAssets": {"totalCount": 101}
}`

func TestBatchMapsRelease(t *testing.T) {
	var n node[gqlRelease]
	if err := json.Unmarshal([]byte(releaseFixture), &n); err != nil {
		t.Fatal(err)
	}
	b := &batch{repoID: 3}
	b.addRelease(n)
	if b.err != nil {
		t.Fatal(b.err)
	}
	if len(b.releases) != 1 {
		t.Fatalf("releases = %+v", b.releases)
	}
	r := b.releases[0]
	if r.GithubID != 150000001 || r.RepositoryID != 3 || r.TagName != "v1.2.0" || r.Name != nil || *r.Body != "Notes" ||
		*r.TagCommitSha != "aaaa" || !r.IsPrerelease || r.IsLatest || *r.AuthorLogin != "alice" ||
		r.AssetCount != 101 || string(r.ReactionCounts) != `{"hooray":3}` || r.GithubPublishedAt == nil {
		t.Errorf("release row = %+v", r)
	}
	raw := string(r.RawPayload)
	if strings.Contains(raw, "releaseAssets") || !strings.Contains(raw, `"immutable"`) {
		t.Errorf("raw_payload = %s", raw)
	}

	// A release without a database ID can't be keyed and is skipped.
	b = &batch{repoID: 3}
	b.addRelease(node[gqlRelease]{V: gqlRelease{ID: "RE_2"}})
	if len(b.releases) != 0 {
		t.Errorf("release without databaseId was mapped: %+v", b.releases)
	}
}

func TestBatchMapsReleaseAssets(t *testing.T) {
	var v gqlReleaseAssets
	err := json.Unmarshal([]byte(`{
	  "id": "RE_1", "databaseId": 150000001,
	  "releaseAssets": {"pageInfo": {"hasNextPage": true, "endCursor": "A1"}, "nodes": [
	    {"id": "RA_1", "name": "app.tar.gz", "contentType": "application/gzip", "size": 2048, "downloadCount": 17,
	     "downloadUrl": "https://github.com/o/r/releases/download/v1.2.0/app.tar.gz", "digest": "sha256:ff",
	     "uploadedBy": {"__typename": "Bot", "login": "github-actions"}, "createdAt": "2024-01-01T00:30:00Z", "updatedAt": "2024-01-01T00:31:00Z"}]}
	}`), &v)
	if err != nil {
		t.Fatal(err)
	}
	b := &batch{repoID: 3, users: true}
	b.addReleaseAssets(v.ID, *v.DatabaseID, v.ReleaseAssets)
	if len(b.releaseAssets) != 1 {
		t.Fatalf("assets = %+v", b.releaseAssets)
	}
	if a := b.releaseAssets[0]; a.GithubNodeID != "RA_1" || a.ReleaseGithubID != 150000001 || a.SizeBytes != 2048 ||
		a.DownloadCount != 17 || *a.UploaderLogin != "github-actions[bot]" || *a.Digest != "sha256:ff" ||
		!strings.Contains(string(a.RawPayload), `"digest"`) {
		t.Errorf("asset row = %+v", a)
	}
	want := FetchConnectionArgs{RepositoryID: 3, Connection: ConnReleaseAssets, NodeID: "RE_1", Cursor: "A1", Users: true}
	if len(b.jobs) != 1 || b.jobs[0].Args.(FetchConnectionArgs) != want {
		t.Errorf("jobs = %+v", b.jobs)
	}
}

func TestReleaseAssetBatches(t *testing.T) {
	release := func(id string, assets int32) node[gqlRelease] {
		var n node[gqlRelease]
		n.V.ID, n.V.ReleaseAssets.TotalCount = id, assets
		return n
	}
	// 312 assets count as one page of 100; releases without assets are skipped.
	releases := []node[gqlRelease]{
		release("a", 312), release("b", 0), release("c", 100), release("d", 250),
		release("e", 50), release("f", 100), release("g", 100), release("h", 1),
	}
	var got [][]string
	for _, j := range releaseAssetBatches(9, true, releases) {
		a := j.Args.(FetchReleaseAssetsArgs)
		if a.RepositoryID != 9 || !a.Users {
			t.Errorf("args = %+v", a)
		}
		got = append(got, a.NodeIDs)
	}
	want := [][]string{{"a", "c", "d", "e", "f"}, {"g", "h"}}
	if !slices.EqualFunc(got, want, slices.Equal) {
		t.Errorf("batches = %v, want %v", got, want)
	}
	if jobs := releaseAssetBatches(9, false, []node[gqlRelease]{release("x", 0)}); len(jobs) != 0 {
		t.Errorf("jobs for releases without assets = %+v", jobs)
	}
}

func TestQueryFetchCommits(t *testing.T) {
	q := queryFetchCommits(2)
	for _, want := range []string{"$s0: GitObjectID!, $s1: GitObjectID!", "c0: object(oid: $s0)", "c1: object(oid: $s1)", "fragment commitFields on Commit"} {
		if !strings.Contains(q, want) {
			t.Errorf("query lacks %q:\n%s", want, q)
		}
	}
	if strings.Contains(q, "c2:") {
		t.Error("query has more aliases than SHAs")
	}
}

func TestEveryConnectionHasAQuery(t *testing.T) {
	for _, c := range []string{ConnIssueComments, ConnTimelineItems, ConnPullRequestCommits,
		ConnPullRequestReviews, ConnReviewThreads, ConnThreadComments, ConnReleaseAssets} {
		if connectionQueries[c] == "" {
			t.Errorf("no query for connection %q", c)
		}
	}
	if len(eventTypes) != len(pullRequestTimelineEvents) {
		t.Error("duplicate __typename in the timeline event tables")
	}
}

func TestQueryFetchUsers(t *testing.T) {
	q := queryFetchUsers(2)
	for _, want := range []string{"query($l0: String!, $l1: String!)", "u0: repositoryOwner(login: $l0)", "u1: repositoryOwner(login: $l1)", "fragment ownerFields on RepositoryOwner"} {
		if !strings.Contains(q, want) {
			t.Errorf("query lacks %q:\n%s", want, q)
		}
	}
	if strings.Contains(q, "u2:") {
		t.Error("query has more aliases than logins")
	}
}

// A queryFetchUsers response for a user, an organization and a login that no
// longer resolves.
const usersFixture = `{
  "u0": {"__typename": "User", "id": "U_1", "login": "spf13", "url": "https://github.com/spf13", "databaseId": 173412,
         "name": "Steve Francia", "company": null, "location": "NYC", "email": "", "websiteUrl": "http://spf13.com",
         "bio": "b", "isSiteAdmin": false, "createdAt": "2009-12-29T03:37:15Z", "updatedAt": "2024-01-01T00:00:00Z",
         "followers": {"totalCount": 16701}, "following": {"totalCount": 85}, "repositories": {"totalCount": 123}},
  "u1": {"__typename": "Organization", "id": "O_1", "login": "dependabot", "url": "https://github.com/dependabot",
         "databaseId": 27347476, "name": "Dependabot", "location": null, "email": null, "websiteUrl": null,
         "description": "d", "isVerified": true, "createdAt": "2017-04-12T11:03:37Z", "updatedAt": "2025-03-11T20:05:57Z",
         "repositories": {"totalCount": 26}},
  "u2": null
}`

func TestUsersFrom(t *testing.T) {
	var data map[string]json.RawMessage
	if err := json.Unmarshal([]byte(usersFixture), &data); err != nil {
		t.Fatal(err)
	}
	rows, err := usersFrom(data, []string{"spf13", "dependabot", "renamed"})
	if err != nil {
		t.Fatal(err)
	}
	if len(rows) != 2 {
		t.Fatalf("rows = %+v (unresolved logins must be skipped)", rows)
	}
	if u := rows[0]; u.GithubID != 173412 || u.Login != "spf13" || u.AccountType != "User" || u.Email != nil ||
		u.Company != nil || *u.BlogUrl != "http://spf13.com" || *u.FollowerCount != 16701 || *u.FollowingCount != 85 ||
		u.PublicRepositoryCount != 123 || !strings.Contains(string(u.RawPayload), `"bio"`) {
		t.Errorf("user row = %+v", u)
	}
	if o := rows[1]; o.AccountType != "Organization" || o.FollowerCount != nil || o.FollowingCount != nil ||
		o.PublicRepositoryCount != 26 || o.IsSiteAdmin {
		t.Errorf("organization row = %+v", o)
	}
}

func TestBotRow(t *testing.T) {
	var u node[restUser]
	// REST names this bot "Copilot"; the data mined through GraphQL refers to
	// it by the login it was looked up with.
	err := json.Unmarshal([]byte(`{"id": 175728472, "node_id": "BOT_kgDOCnlnWA", "login": "Copilot",
	  "type": "Bot", "site_admin": false, "name": null, "blog": "", "email": null, "public_repos": 0,
	  "followers": 0, "following": 0, "created_at": "2024-07-01T00:00:00Z", "updated_at": "2024-07-01T00:00:00Z"}`), &u)
	if err != nil {
		t.Fatal(err)
	}
	r := botRow("copilot-pull-request-reviewer[bot]", u)
	if r.GithubID != 175728472 || r.Login != "copilot-pull-request-reviewer[bot]" || r.AccountType != "Bot" ||
		r.BlogUrl != nil || *r.FollowerCount != 0 || !strings.Contains(string(r.RawPayload), `"login": "Copilot"`) {
		t.Errorf("bot row = %+v", r)
	}
}

func TestUserJobs(t *testing.T) {
	logins := []string{"dependabot[bot]"}
	for i := range userBatchSize + 1 {
		logins = append(logins, fmt.Sprintf("user%d", i))
	}
	jobs := userJobs(logins)
	if len(jobs) != 3 {
		t.Fatalf("jobs = %d, want a bot job and two user batches", len(jobs))
	}
	if a := jobs[0].Args.(FetchBotArgs); a.Login != "dependabot[bot]" {
		t.Errorf("bot job = %+v", a)
	}
	if a := jobs[1].Args.(FetchUsersArgs); len(a.Logins) != userBatchSize || a.Logins[0] != "user0" {
		t.Errorf("first user batch = %d logins", len(a.Logins))
	}
	if a := jobs[2].Args.(FetchUsersArgs); len(a.Logins) != 1 {
		t.Errorf("second user batch = %+v", a)
	}
	if jobs := userJobs(nil); len(jobs) != 0 {
		t.Errorf("jobs for no logins = %+v", jobs)
	}
}

// ---- datasets.go ----

func TestDatasetsAreValid(t *testing.T) {
	for _, d := range (&Platform{}).Datasets() {
		if err := d.Validate(); err != nil {
			t.Error(err)
		}
	}
}
