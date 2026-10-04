package github

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"
	"time"

	"github.com/riverqueue/river"

	"raise/internal/jobkit"
	"raise/internal/platform/github/sqlc"
)

// GraphQL response types: the subset of each node that is modelled in
// columns. The node's full JSON is kept in raw_payload, minus nested
// connections that are stored in their own tables.

// node decodes a T and keeps the raw JSON it was decoded from.
type node[T any] struct {
	V   T
	Raw json.RawMessage
}

func (n *node[T]) UnmarshalJSON(b []byte) error {
	n.Raw = append(json.RawMessage(nil), b...)
	return json.Unmarshal(b, &n.V)
}

type gqlPageInfo struct {
	HasNextPage bool   `json:"hasNextPage"`
	EndCursor   string `json:"endCursor"`
}

type conn[T any] struct {
	TotalCount int32       `json:"totalCount"`
	PageInfo   gqlPageInfo `json:"pageInfo"`
	Nodes      []T         `json:"nodes"`
}

type gqlActor struct {
	Login string `json:"login"`
}

type gqlCommitRef struct {
	Oid string `json:"oid"`
}

// bigInt decodes GraphQL's BigInt scalar, which GitHub serialises as a string.
// The Int databaseId fields overflow for recent issues, comments and reviews,
// so fullDatabaseId is used throughout.
type bigInt int64

func (b *bigInt) UnmarshalJSON(data []byte) error {
	s := strings.Trim(string(data), `"`)
	if s == "null" {
		return nil
	}
	n, err := strconv.ParseInt(s, 10, 64)
	*b = bigInt(n)
	return err
}

type gqlReactionGroup struct {
	Content  string `json:"content"`
	Reactors struct {
		TotalCount int32 `json:"totalCount"`
	} `json:"reactors"`
}

type gqlRepository struct {
	ID               string  `json:"id"`
	DatabaseID       int64   `json:"databaseId"`
	NameWithOwner    string  `json:"nameWithOwner"`
	Description      *string `json:"description"`
	HomepageURL      *string `json:"homepageUrl"`
	DefaultBranchRef *struct {
		Name string `json:"name"`
	} `json:"defaultBranchRef"`
	PrimaryLanguage *struct {
		Name string `json:"name"`
	} `json:"primaryLanguage"`
	Languages struct {
		Edges []struct {
			Size int64 `json:"size"`
			Node struct {
				Name string `json:"name"`
			} `json:"node"`
		} `json:"edges"`
	} `json:"languages"`
	RepositoryTopics conn[struct {
		Topic struct {
			Name string `json:"name"`
		} `json:"topic"`
	}] `json:"repositoryTopics"`
	LicenseInfo *struct {
		SpdxID *string `json:"spdxId"`
	} `json:"licenseInfo"`
	Visibility string `json:"visibility"`
	IsFork     bool   `json:"isFork"`
	IsArchived bool   `json:"isArchived"`
	IsTemplate bool   `json:"isTemplate"`
	Parent     *struct {
		NameWithOwner string `json:"nameWithOwner"`
	} `json:"parent"`
	StargazerCount   int32      `json:"stargazerCount"`
	ForkCount        int32      `json:"forkCount"`
	Watchers         conn[any]  `json:"watchers"`
	OpenIssues       conn[any]  `json:"openIssues"`
	OpenPullRequests conn[any]  `json:"openPullRequests"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
	PushedAt         *time.Time `json:"pushedAt"`
}

// gqlConversation holds the fields issues and pull requests share; both are
// stored in github_issues.
type gqlConversation struct {
	ID                string    `json:"id"`
	FullDatabaseID    bigInt    `json:"fullDatabaseId"`
	Number            int32     `json:"number"`
	Title             string    `json:"title"`
	State             string    `json:"state"`
	Body              string    `json:"body"`
	Locked            bool      `json:"locked"`
	Author            *gqlActor `json:"author"`
	AuthorAssociation string    `json:"authorAssociation"`
	Milestone         *struct {
		Title string `json:"title"`
	} `json:"milestone"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
	ClosedAt  *time.Time `json:"closedAt"`
	Labels    conn[struct {
		Name string `json:"name"`
	}] `json:"labels"`
	Assignees      conn[gqlActor]              `json:"assignees"`
	ReactionGroups []gqlReactionGroup          `json:"reactionGroups"`
	Comments       conn[node[gqlComment]]      `json:"comments"`
	TimelineItems  conn[node[gqlTimelineItem]] `json:"timelineItems"`
}

type gqlIssue struct {
	gqlConversation
	StateReason *string `json:"stateReason"`
}

type gqlPullRequest struct {
	gqlConversation
	IsDraft        bool       `json:"isDraft"`
	Merged         bool       `json:"merged"`
	MergedAt       *time.Time `json:"mergedAt"`
	MergedBy       *gqlActor  `json:"mergedBy"`
	HeadRefName    string     `json:"headRefName"`
	HeadRefOid     string     `json:"headRefOid"`
	HeadRepository *struct {
		NameWithOwner string `json:"nameWithOwner"`
	} `json:"headRepository"`
	BaseRefName    string        `json:"baseRefName"`
	BaseRefOid     string        `json:"baseRefOid"`
	MergeCommit    *gqlCommitRef `json:"mergeCommit"`
	ChangedFiles   int32         `json:"changedFiles"`
	Additions      int32         `json:"additions"`
	Deletions      int32         `json:"deletions"`
	ReviewRequests conn[struct {
		RequestedReviewer *struct {
			Login string `json:"login"` // users, bots and mannequins; teams have none
		} `json:"requestedReviewer"`
	}] `json:"reviewRequests"`
	Commits       conn[gqlPullRequestCommit] `json:"commits"`
	Reviews       conn[node[gqlReview]]      `json:"reviews"`
	ReviewThreads conn[gqlReviewThread]      `json:"reviewThreads"`
}

type gqlComment struct {
	FullDatabaseID    bigInt             `json:"fullDatabaseId"`
	Author            *gqlActor          `json:"author"`
	AuthorAssociation string             `json:"authorAssociation"`
	Body              string             `json:"body"`
	CreatedAt         time.Time          `json:"createdAt"`
	UpdatedAt         time.Time          `json:"updatedAt"`
	ReactionGroups    []gqlReactionGroup `json:"reactionGroups"`
}

type gqlTimelineItem struct {
	Typename  string    `json:"__typename"`
	ID        string    `json:"id"`
	Actor     *gqlActor `json:"actor"`
	CreatedAt time.Time `json:"createdAt"`
	// Commit references, depending on the event type.
	Commit      *gqlCommitRef `json:"commit"`
	AfterCommit *gqlCommitRef `json:"afterCommit"`
	Closer      *struct {
		Oid string `json:"oid"`
	} `json:"closer"`
}

type gqlPullRequestCommit struct {
	Commit gqlCommitRef `json:"commit"`
}

type gqlReview struct {
	FullDatabaseID    *bigInt       `json:"fullDatabaseId"`
	Author            *gqlActor     `json:"author"`
	AuthorAssociation string        `json:"authorAssociation"`
	State             string        `json:"state"`
	Body              string        `json:"body"`
	Commit            *gqlCommitRef `json:"commit"`
	SubmittedAt       *time.Time    `json:"submittedAt"`
	UpdatedAt         time.Time     `json:"updatedAt"`
}

type gqlReviewThread struct {
	ID             string                       `json:"id"`
	ReviewComments conn[node[gqlReviewComment]] `json:"reviewComments"`
}

type gqlReviewComment struct {
	FullDatabaseID    bigInt        `json:"fullDatabaseId"`
	Author            *gqlActor     `json:"author"`
	AuthorAssociation string        `json:"authorAssociation"`
	Body              string        `json:"body"`
	Path              string        `json:"path"`
	Line              *int32        `json:"line"`
	OriginalLine      *int32        `json:"originalLine"`
	DiffHunk          string        `json:"diffHunk"`
	Commit            *gqlCommitRef `json:"commit"`
	PullRequestReview *struct {
		FullDatabaseID *bigInt `json:"fullDatabaseId"`
	} `json:"pullRequestReview"`
	ReplyTo *struct {
		FullDatabaseID *bigInt `json:"fullDatabaseId"`
	} `json:"replyTo"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// nestedConnections are stripped from raw_payload: they have their own tables.
var nestedConnections = []string{"comments", "timelineItems", "commits", "reviews", "reviewThreads"}

func repositoryRow(repoID int64, r node[gqlRepository]) (sqlc.UpsertRepositoryParams, error) {
	v := r.V
	langs := map[string]int64{}
	for _, e := range v.Languages.Edges {
		langs[e.Node.Name] = e.Size
	}
	langJSON, err := json.Marshal(langs)
	if err != nil {
		return sqlc.UpsertRepositoryParams{}, err
	}
	p := sqlc.UpsertRepositoryParams{
		RepositoryID: repoID, GithubID: v.DatabaseID, GithubNodeID: v.ID, FullName: v.NameWithOwner,
		Description: emptyToNil(v.Description), HomepageURL: emptyToNil(v.HomepageURL),
		LanguageBytes: langJSON, TopicNames: []string{}, Visibility: strings.ToLower(v.Visibility),
		IsFork: v.IsFork, IsArchived: v.IsArchived, IsTemplate: v.IsTemplate,
		StarCount: v.StargazerCount, WatcherCount: v.Watchers.TotalCount, ForkCount: v.ForkCount,
		OpenIssueCount: v.OpenIssues.TotalCount, OpenPullRequestCount: v.OpenPullRequests.TotalCount,
		GithubCreatedAt: v.CreatedAt, GithubUpdatedAt: v.UpdatedAt, GithubPushedAt: v.PushedAt,
		RawPayload: r.Raw,
	}
	if v.DefaultBranchRef != nil {
		p.DefaultBranch = &v.DefaultBranchRef.Name
	}
	if v.PrimaryLanguage != nil {
		p.PrimaryLanguage = &v.PrimaryLanguage.Name
	}
	if v.LicenseInfo != nil {
		p.LicenseSpdxID = v.LicenseInfo.SpdxID
	}
	if v.Parent != nil {
		p.ParentFullName = &v.Parent.NameWithOwner
	}
	for _, t := range v.RepositoryTopics.Nodes {
		p.TopicNames = append(p.TopicNames, t.Topic.Name)
	}
	return p, nil
}

// batch accumulates the rows and follow-up jobs produced by one job, so they
// are written and enqueued in a single transaction.
type batch struct {
	repoID         int64
	issues         []sqlc.UpsertIssueParams
	pullRequests   []sqlc.UpsertPullRequestParams
	commitTrims    []sqlc.TrimPullRequestCommitsParams
	commits        []sqlc.UpsertPullRequestCommitParams
	reviews        []sqlc.UpsertPullRequestReviewParams
	reviewComments []sqlc.UpsertPullRequestReviewCommentParams
	comments       []sqlc.UpsertIssueCommentParams
	events         []sqlc.InsertIssueEventParams
	jobs           []river.InsertManyParams
	err            error
}

func (b *batch) addIssue(n node[gqlIssue]) {
	v := n.V
	row := b.conversationRow(v.gqlConversation, n.Raw, false)
	if v.StateReason != nil {
		row.StateReason = new(strings.ToLower(*v.StateReason))
	}
	b.issues = append(b.issues, row)
	b.addComments(v.ID, v.Number, v.Comments)
	b.addTimeline(v.ID, v.Number, v.TimelineItems)
}

func (b *batch) addPullRequest(n node[gqlPullRequest]) {
	v := n.V
	b.issues = append(b.issues, b.conversationRow(v.gqlConversation, n.Raw, true))

	p := sqlc.UpsertPullRequestParams{
		RepositoryID: b.repoID, Number: v.Number, GithubID: int64(v.FullDatabaseID), GithubNodeID: v.ID,
		State: conversationState(v.State), IsDraft: v.IsDraft, IsMerged: v.Merged,
		AuthorLogin: login(v.Author), MergedByLogin: login(v.MergedBy),
		HeadRef: v.HeadRefName, HeadSha: v.HeadRefOid, BaseRef: v.BaseRefName, BaseSha: v.BaseRefOid,
		CommitCount: v.Commits.TotalCount, FilesChanged: v.ChangedFiles,
		LinesAdded: v.Additions, LinesDeleted: v.Deletions,
		CommentCount: v.Comments.TotalCount, ReviewCount: v.Reviews.TotalCount,
		ReviewThreadCount: v.ReviewThreads.TotalCount, RequestedReviewerLogins: []string{},
		GithubCreatedAt: v.CreatedAt, GithubUpdatedAt: v.UpdatedAt,
		GithubClosedAt: v.ClosedAt, GithubMergedAt: v.MergedAt,
		RawPayload: b.strip(n.Raw),
	}
	if v.HeadRepository != nil {
		p.HeadRepositoryFullName = &v.HeadRepository.NameWithOwner
	}
	if v.MergeCommit != nil {
		p.MergeCommitSha = &v.MergeCommit.Oid
	}
	for _, r := range v.ReviewRequests.Nodes {
		if r.RequestedReviewer != nil && r.RequestedReviewer.Login != "" {
			p.RequestedReviewerLogins = append(p.RequestedReviewerLogins, r.RequestedReviewer.Login)
		}
	}
	b.pullRequests = append(b.pullRequests, p)
	b.commitTrims = append(b.commitTrims, sqlc.TrimPullRequestCommitsParams{
		RepositoryID: b.repoID, PullRequestNumber: v.Number, CommitCount: v.Commits.TotalCount,
	})

	b.addComments(v.ID, v.Number, v.Comments)
	b.addTimeline(v.ID, v.Number, v.TimelineItems)
	b.addCommits(v.ID, v.Number, 0, v.Commits)
	b.addReviews(v.ID, v.Number, v.Reviews)
	b.addReviewThreads(v.ID, v.Number, v.ReviewThreads)
}

func (b *batch) conversationRow(v gqlConversation, raw json.RawMessage, isPR bool) sqlc.UpsertIssueParams {
	row := sqlc.UpsertIssueParams{
		RepositoryID: b.repoID, Number: v.Number, GithubID: int64(v.FullDatabaseID), GithubNodeID: v.ID,
		Title: v.Title, State: conversationState(v.State),
		AuthorLogin: login(v.Author), AuthorAssociation: v.AuthorAssociation,
		LabelNames: []string{}, AssigneeLogins: []string{}, IsLocked: v.Locked,
		CommentCount: v.Comments.TotalCount, ReactionCounts: b.reactions(v.ReactionGroups),
		IsPullRequest: isPR, Body: emptyToNil(&v.Body),
		GithubCreatedAt: v.CreatedAt, GithubUpdatedAt: v.UpdatedAt, GithubClosedAt: v.ClosedAt,
		RawPayload: b.strip(raw),
	}
	if v.Milestone != nil {
		row.MilestoneTitle = &v.Milestone.Title
	}
	for _, l := range v.Labels.Nodes {
		row.LabelNames = append(row.LabelNames, l.Name)
	}
	for _, a := range v.Assignees.Nodes {
		row.AssigneeLogins = append(row.AssigneeLogins, a.Login)
	}
	return row
}

func (b *batch) addComments(parentID string, number int32, c conn[node[gqlComment]]) {
	for _, n := range c.Nodes {
		v := n.V
		b.comments = append(b.comments, sqlc.UpsertIssueCommentParams{
			GithubID: int64(v.FullDatabaseID), RepositoryID: b.repoID, IssueNumber: number,
			AuthorLogin: login(v.Author), AuthorAssociation: v.AuthorAssociation, Body: v.Body,
			ReactionCounts:  b.reactions(v.ReactionGroups),
			GithubCreatedAt: v.CreatedAt, GithubUpdatedAt: v.UpdatedAt, RawPayload: n.Raw,
		})
	}
	b.continueConnection(ConnIssueComments, parentID, c.PageInfo, 0)
}

func (b *batch) addTimeline(parentID string, number int32, c conn[node[gqlTimelineItem]]) {
	for _, n := range c.Nodes {
		v := n.V
		eventType, ok := eventTypes[v.Typename]
		if !ok || v.ID == "" {
			continue
		}
		e := sqlc.InsertIssueEventParams{
			GithubNodeID: v.ID, RepositoryID: b.repoID, IssueNumber: number, EventType: eventType,
			ActorLogin: login(v.Actor), GithubCreatedAt: v.CreatedAt, RawPayload: n.Raw,
		}
		switch {
		case v.Commit != nil:
			e.CommitSha = &v.Commit.Oid
		case v.AfterCommit != nil:
			e.CommitSha = &v.AfterCommit.Oid
		case v.Closer != nil && v.Closer.Oid != "":
			e.CommitSha = &v.Closer.Oid
		}
		b.events = append(b.events, e)
	}
	b.continueConnection(ConnTimelineItems, parentID, c.PageInfo, 0)
}

func (b *batch) addCommits(prID string, number int32, offset int, c conn[gqlPullRequestCommit]) {
	for i, n := range c.Nodes {
		b.commits = append(b.commits, sqlc.UpsertPullRequestCommitParams{
			RepositoryID: b.repoID, PullRequestNumber: number, Position: int32(offset + i), Sha: n.Commit.Oid,
		})
	}
	b.continueConnection(ConnPullRequestCommits, prID, c.PageInfo, offset+len(c.Nodes))
}

func (b *batch) addReviews(prID string, number int32, c conn[node[gqlReview]]) {
	for _, n := range c.Nodes {
		v := n.V
		// Pending reviews are drafts, visible only to their author.
		if v.FullDatabaseID == nil || v.State == "PENDING" {
			continue
		}
		r := sqlc.UpsertPullRequestReviewParams{
			GithubID: int64(*v.FullDatabaseID), RepositoryID: b.repoID, PullRequestNumber: number,
			ReviewerLogin: login(v.Author), AuthorAssociation: v.AuthorAssociation,
			State: strings.ToLower(v.State), Body: v.Body,
			GithubSubmittedAt: v.SubmittedAt, GithubUpdatedAt: v.UpdatedAt, RawPayload: n.Raw,
		}
		if v.Commit != nil {
			r.CommitSha = &v.Commit.Oid
		}
		b.reviews = append(b.reviews, r)
	}
	b.continueConnection(ConnPullRequestReviews, prID, c.PageInfo, 0)
}

func (b *batch) addReviewThreads(prID string, number int32, c conn[gqlReviewThread]) {
	for _, t := range c.Nodes {
		b.addThreadComments(t.ID, number, t.ReviewComments)
	}
	b.continueConnection(ConnReviewThreads, prID, c.PageInfo, 0)
}

func (b *batch) addThreadComments(threadID string, number int32, c conn[node[gqlReviewComment]]) {
	for _, n := range c.Nodes {
		v := n.V
		rc := sqlc.UpsertPullRequestReviewCommentParams{
			GithubID: int64(v.FullDatabaseID), RepositoryID: b.repoID, PullRequestNumber: number,
			ThreadGithubNodeID: threadID, AuthorLogin: login(v.Author), AuthorAssociation: v.AuthorAssociation,
			Path: v.Path, Line: v.Line, OriginalLine: v.OriginalLine, DiffHunk: v.DiffHunk, Body: v.Body,
			GithubCreatedAt: v.CreatedAt, GithubUpdatedAt: v.UpdatedAt, RawPayload: n.Raw,
		}
		if v.PullRequestReview != nil && v.PullRequestReview.FullDatabaseID != nil {
			rc.ReviewGithubID = new(int64(*v.PullRequestReview.FullDatabaseID))
		}
		if v.ReplyTo != nil && v.ReplyTo.FullDatabaseID != nil {
			rc.InReplyToGithubID = new(int64(*v.ReplyTo.FullDatabaseID))
		}
		if v.Commit != nil {
			rc.CommitSha = &v.Commit.Oid
		}
		b.reviewComments = append(b.reviewComments, rc)
	}
	b.continueConnection(ConnThreadComments, threadID, c.PageInfo, 0)
}

// continueConnection enqueues the next page of a nested connection that
// didn't fit in this response.
func (b *batch) continueConnection(connection, nodeID string, pi gqlPageInfo, offset int) {
	if !pi.HasNextPage || pi.EndCursor == "" {
		return
	}
	b.jobs = append(b.jobs, jobkit.Job(FetchConnectionArgs{
		RepositoryID: b.repoID, Connection: connection, NodeID: nodeID, Cursor: pi.EndCursor, Offset: offset,
	}))
}

// strip removes nested connections from a node's raw JSON.
func (b *batch) strip(raw json.RawMessage) json.RawMessage {
	var m map[string]json.RawMessage
	if err := json.Unmarshal(raw, &m); err != nil {
		b.fail(err)
		return raw
	}
	for _, k := range nestedConnections {
		delete(m, k)
	}
	out, err := json.Marshal(m)
	if err != nil {
		b.fail(err)
		return raw
	}
	return out
}

// reactionKeys maps GraphQL reaction contents to the REST names used in
// reaction_counts.
var reactionKeys = map[string]string{
	"THUMBS_UP": "+1", "THUMBS_DOWN": "-1", "LAUGH": "laugh", "HOORAY": "hooray",
	"CONFUSED": "confused", "HEART": "heart", "ROCKET": "rocket", "EYES": "eyes",
}

// reactions returns the non-zero reaction counts as a JSON object.
func (b *batch) reactions(groups []gqlReactionGroup) json.RawMessage {
	m := map[string]int32{}
	for _, g := range groups {
		if g.Reactors.TotalCount == 0 {
			continue
		}
		key, ok := reactionKeys[g.Content]
		if !ok {
			key = strings.ToLower(g.Content)
		}
		m[key] = g.Reactors.TotalCount
	}
	out, err := json.Marshal(m)
	b.fail(err)
	return out
}

func (b *batch) fail(err error) {
	if err != nil && b.err == nil {
		b.err = err
	}
}

// write stores every accumulated row. Parents are written before children so
// readers in other transactions never see comments without their issue.
func (b *batch) write(ctx context.Context, q *sqlc.Queries) error {
	if b.err != nil {
		return b.err
	}
	for _, run := range []func() error{
		func() error { return execBatch(ctx, q.UpsertIssue, b.issues) },
		func() error { return execBatch(ctx, q.UpsertPullRequest, b.pullRequests) },
		func() error { return execBatch(ctx, q.TrimPullRequestCommits, b.commitTrims) },
		func() error { return execBatch(ctx, q.UpsertPullRequestCommit, b.commits) },
		func() error { return execBatch(ctx, q.UpsertPullRequestReview, b.reviews) },
		func() error { return execBatch(ctx, q.UpsertPullRequestReviewComment, b.reviewComments) },
		func() error { return execBatch(ctx, q.UpsertIssueComment, b.comments) },
		func() error { return execBatch(ctx, q.InsertIssueEvent, b.events) },
	} {
		if err := run(); err != nil {
			return err
		}
	}
	return nil
}

type batchResults interface {
	Exec(func(int, error))
	Close() error
}

// execBatch sends one sqlc :batchexec query for all params and returns the
// first error.
func execBatch[P any, R batchResults](ctx context.Context, send func(context.Context, []P) R, params []P) error {
	if len(params) == 0 {
		return nil
	}
	res := send(ctx, params)
	var first error
	res.Exec(func(_ int, err error) {
		if err != nil && first == nil {
			first = err
		}
	})
	if err := res.Close(); err != nil && first == nil {
		first = err
	}
	return first
}

// conversationState maps GraphQL's OPEN/CLOSED/MERGED to open/closed; merged
// pull requests are closed with is_merged set.
func conversationState(s string) string {
	if s == "OPEN" {
		return "open"
	}
	return "closed"
}

func login(a *gqlActor) *string {
	if a == nil {
		return nil
	}
	return &a.Login
}

func emptyToNil(s *string) *string {
	if s == nil || *s == "" {
		return nil
	}
	return s
}
