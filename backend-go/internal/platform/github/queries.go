package github

import (
	"strconv"
	"strings"
)

// GraphQL documents. Every query selects exactly what store.go maps, plus a
// few unmodelled fields worth keeping in raw_payload. A document may only
// contain the fragments it uses, so fragments are appended per query.

// Page sizes. Listing is cheap (IDs only); fetch batches carry every nested
// connection, so they are kept small enough to stay well under GitHub's
// 10-second query timeout. A batch that still times out is split in two.
const (
	listPageSize         = 100
	issueBatchSize       = 25
	pullRequestBatchSize = 10
	// First page of each nested connection fetched with its parent; the rest
	// is fetched by FetchConnection jobs.
	nestedPageSize       = 100
	reviewThreadPageSize = 30
	threadCommentSize    = 20
)

const queryRepository = `query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    id databaseId nameWithOwner url description homepageUrl
    defaultBranchRef { name }
    primaryLanguage { name }
    languages(first: 100, orderBy: {field: SIZE, direction: DESC}) { edges { size node { name } } }
    repositoryTopics(first: 100) { nodes { topic { name } } }
    licenseInfo { spdxId name }
    visibility isFork isArchived isTemplate isMirror isLocked isDisabled isEmpty mirrorUrl
    parent { nameWithOwner }
    templateRepository { nameWithOwner }
    stargazerCount forkCount
    watchers { totalCount }
    openIssues: issues(states: OPEN) { totalCount }
    openPullRequests: pullRequests(states: OPEN) { totalCount }
    hasIssuesEnabled hasWikiEnabled hasDiscussionsEnabled hasProjectsEnabled
    diskUsage createdAt updatedAt pushedAt
  }
}`

// queryListIssues lists issue node IDs in creation order, so cursors stay
// stable while new issues arrive. $since filters on updatedAt.
const queryListIssues = `query($owner: String!, $name: String!, $cursor: String, $since: DateTime) {
  repository(owner: $owner, name: $name) {
    issues(first: 100, after: $cursor, orderBy: {field: CREATED_AT, direction: ASC}, filterBy: {since: $since}) {
      pageInfo { hasNextPage endCursor }
      nodes { id }
    }
  }
}`

// queryListPullRequests lists pull request node IDs. Pull requests have no
// "since" filter: incremental runs order by UPDATED_AT DESC and stop at the
// first one older than since.
const queryListPullRequests = `query($owner: String!, $name: String!, $cursor: String, $field: IssueOrderField!, $direction: OrderDirection!) {
  repository(owner: $owner, name: $name) {
    pullRequests(first: 100, after: $cursor, orderBy: {field: $field, direction: $direction}) {
      pageInfo { hasNextPage endCursor }
      nodes { id updatedAt }
    }
  }
}`

const pageInfo = `pageInfo { hasNextPage endCursor }`

const fragmentComment = `
fragment commentFields on IssueComment {
  id fullDatabaseId author { login } authorAssociation body url
  createdAt updatedAt lastEditedAt isMinimized minimizedReason
  reactionGroups { content reactors { totalCount } }
}`

const fragmentReview = `
fragment reviewFields on PullRequestReview {
  id fullDatabaseId author { login } authorAssociation state body url
  commit { oid } createdAt submittedAt updatedAt lastEditedAt
}`

const fragmentReviewComment = `
fragment reviewCommentFields on PullRequestReviewComment {
  id fullDatabaseId author { login } authorAssociation body url
  path line originalLine startLine originalStartLine diffHunk outdated
  commit { oid } originalCommit { oid }
  pullRequestReview { fullDatabaseId }
  replyTo { fullDatabaseId }
  createdAt updatedAt lastEditedAt
}`

// timelineEvent describes one timeline item type stored in
// github_issue_events. Comments, reviews and commits also appear in the
// timeline but are stored in their own tables, so they are not requested.
type timelineEvent struct {
	itemType  string // IssueTimelineItemsItemType / PullRequestTimelineItemsItemType
	typename  string // GraphQL __typename
	eventType string // REST event name, stored in event_type
	fields    string // selection beyond id, actor and createdAt
}

const refTarget = `{ __typename ... on Issue { number repository { nameWithOwner } } ... on PullRequest { number repository { nameWithOwner } } }`

var issueTimelineEvents = []timelineEvent{
	{"ASSIGNED_EVENT", "AssignedEvent", "assigned", "assignee { ... on Actor { login } }"},
	{"UNASSIGNED_EVENT", "UnassignedEvent", "unassigned", "assignee { ... on Actor { login } }"},
	{"LABELED_EVENT", "LabeledEvent", "labeled", "label { name }"},
	{"UNLABELED_EVENT", "UnlabeledEvent", "unlabeled", "label { name }"},
	{"MILESTONED_EVENT", "MilestonedEvent", "milestoned", "milestoneTitle"},
	{"DEMILESTONED_EVENT", "DemilestonedEvent", "demilestoned", "milestoneTitle"},
	{"RENAMED_TITLE_EVENT", "RenamedTitleEvent", "renamed", "previousTitle currentTitle"},
	{"CLOSED_EVENT", "ClosedEvent", "closed", "stateReason closer { __typename ... on Commit { oid } ... on PullRequest { number } }"},
	{"REOPENED_EVENT", "ReopenedEvent", "reopened", "stateReason"},
	{"LOCKED_EVENT", "LockedEvent", "locked", "lockReason"},
	{"UNLOCKED_EVENT", "UnlockedEvent", "unlocked", ""},
	{"REFERENCED_EVENT", "ReferencedEvent", "referenced", "isCrossRepository commit { oid } commitRepository { nameWithOwner }"},
	{"CROSS_REFERENCED_EVENT", "CrossReferencedEvent", "cross-referenced", "isCrossRepository willCloseTarget referencedAt source " + refTarget},
	{"CONNECTED_EVENT", "ConnectedEvent", "connected", "isCrossRepository subject " + refTarget},
	{"DISCONNECTED_EVENT", "DisconnectedEvent", "disconnected", "isCrossRepository subject " + refTarget},
	{"MARKED_AS_DUPLICATE_EVENT", "MarkedAsDuplicateEvent", "marked_as_duplicate", "isCrossRepository canonical " + refTarget},
	{"UNMARKED_AS_DUPLICATE_EVENT", "UnmarkedAsDuplicateEvent", "unmarked_as_duplicate", "isCrossRepository canonical " + refTarget},
	{"TRANSFERRED_EVENT", "TransferredEvent", "transferred", "fromRepository { nameWithOwner }"},
	{"COMMENT_DELETED_EVENT", "CommentDeletedEvent", "comment_deleted", "deletedCommentAuthor { login }"},
	{"PINNED_EVENT", "PinnedEvent", "pinned", ""},
	{"UNPINNED_EVENT", "UnpinnedEvent", "unpinned", ""},
}

var pullRequestOnlyTimelineEvents = []timelineEvent{
	{"MERGED_EVENT", "MergedEvent", "merged", "mergeRefName commit { oid }"},
	{"READY_FOR_REVIEW_EVENT", "ReadyForReviewEvent", "ready_for_review", ""},
	{"CONVERT_TO_DRAFT_EVENT", "ConvertToDraftEvent", "convert_to_draft", ""},
	{"REVIEW_REQUESTED_EVENT", "ReviewRequestedEvent", "review_requested", "requestedReviewer { __typename ... on Actor { login } ... on Team { combinedSlug } }"},
	{"REVIEW_REQUEST_REMOVED_EVENT", "ReviewRequestRemovedEvent", "review_request_removed", "requestedReviewer { __typename ... on Actor { login } ... on Team { combinedSlug } }"},
	{"REVIEW_DISMISSED_EVENT", "ReviewDismissedEvent", "review_dismissed", "dismissalMessage previousReviewState review { fullDatabaseId }"},
	{"HEAD_REF_FORCE_PUSHED_EVENT", "HeadRefForcePushedEvent", "head_ref_force_pushed", "ref { name } beforeCommit { oid } afterCommit { oid }"},
	{"HEAD_REF_DELETED_EVENT", "HeadRefDeletedEvent", "head_ref_deleted", "headRefName"},
	{"HEAD_REF_RESTORED_EVENT", "HeadRefRestoredEvent", "head_ref_restored", ""},
	{"BASE_REF_CHANGED_EVENT", "BaseRefChangedEvent", "base_ref_changed", "previousRefName currentRefName"},
	{"BASE_REF_FORCE_PUSHED_EVENT", "BaseRefForcePushedEvent", "base_ref_force_pushed", "ref { name } beforeCommit { oid } afterCommit { oid }"},
	{"AUTO_MERGE_ENABLED_EVENT", "AutoMergeEnabledEvent", "auto_merge_enabled", ""},
	{"AUTO_MERGE_DISABLED_EVENT", "AutoMergeDisabledEvent", "auto_merge_disabled", "reason"},
}

var pullRequestTimelineEvents = append(append([]timelineEvent{}, issueTimelineEvents...), pullRequestOnlyTimelineEvents...)

// eventTypes maps __typename to the stored event_type.
var eventTypes = func() map[string]string {
	m := map[string]string{}
	for _, e := range pullRequestTimelineEvents {
		m[e.typename] = e.eventType
	}
	return m
}()

// timelineConnection renders `timelineItems(...) { ... }` for the given events.
func timelineConnection(events []timelineEvent, size string) string {
	var types, frags []string
	for _, e := range events {
		types = append(types, e.itemType)
		frags = append(frags, "... on "+e.typename+" { id actor { login } createdAt "+e.fields+" }")
	}
	return "timelineItems(first: " + size + ", after: $cursor, itemTypes: [" + strings.Join(types, ", ") + "]) { " +
		pageInfo + " nodes { __typename " + strings.Join(frags, " ") + " } }"
}

// Selections shared by issues and pull requests (the conversation half).
const conversationFields = `
  id fullDatabaseId number title state body url locked activeLockReason
  author { login } authorAssociation
  milestone { title number }
  createdAt updatedAt closedAt lastEditedAt
  labels(first: 100) { nodes { name } }
  assignees(first: 100) { nodes { login } }
  reactionGroups { content reactors { totalCount } }
  comments(first: NESTED) { totalCount ` + pageInfo + ` nodes { ...commentFields } }`

func withSizes(s string) string {
	return strings.NewReplacer(
		"NESTED", strconv.Itoa(nestedPageSize),
		"THREADS", strconv.Itoa(reviewThreadPageSize),
		"THREAD_COMMENTS", strconv.Itoa(threadCommentSize),
	).Replace(s)
}

// $cursor is declared by every document that renders a timeline connection,
// but the batch queries pass null: the nested first page starts at the top.
var queryFetchIssues = withSizes(`query($ids: [ID!]!, $cursor: String) {
  nodes(ids: $ids) {
    ... on Issue {` + conversationFields + `
      stateReason
      ` + timelineConnection(issueTimelineEvents, "NESTED") + `
    }
  }
}` + fragmentComment)

var queryFetchPullRequests = withSizes(`query($ids: [ID!]!, $cursor: String) {
  nodes(ids: $ids) {
    ... on PullRequest {` + conversationFields + `
      isDraft merged mergedAt mergedBy { login }
      headRefName headRefOid headRepository { nameWithOwner }
      baseRefName baseRefOid
      mergeCommit { oid }
      changedFiles additions deletions
      reviewDecision mergeStateStatus maintainerCanModify
      reviewRequests(first: 100) { nodes { requestedReviewer { __typename ... on Actor { login } ... on Team { combinedSlug } } } }
      ` + timelineConnection(pullRequestTimelineEvents, "NESTED") + `
      commits(first: NESTED) { totalCount ` + pageInfo + ` nodes { commit { oid } } }
      reviews(first: NESTED) { totalCount ` + pageInfo + ` nodes { ...reviewFields } }
      reviewThreads(first: THREADS) { totalCount ` + pageInfo + `
        nodes { id reviewComments: comments(first: THREAD_COMMENTS) { ` + pageInfo + ` nodes { ...reviewCommentFields } } }
      }
    }
  }
}` + fragmentComment + fragmentReview + fragmentReviewComment)

// Continuation queries: the next page of one nested connection of one node.
// Each also selects the parent's number so rows can be keyed without lookups.
var connectionQueries = map[string]string{
	ConnIssueComments: withSizes(`query($id: ID!, $cursor: String) {
  node(id: $id) {
    ... on Issue { number comments(first: 100, after: $cursor) { ` + pageInfo + ` nodes { ...commentFields } } }
    ... on PullRequest { number comments(first: 100, after: $cursor) { ` + pageInfo + ` nodes { ...commentFields } } }
  }
}` + fragmentComment),

	ConnTimelineItems: `query($id: ID!, $cursor: String) {
  node(id: $id) {
    ... on Issue { number ` + timelineConnection(issueTimelineEvents, "100") + ` }
    ... on PullRequest { number ` + timelineConnection(pullRequestTimelineEvents, "100") + ` }
  }
}`,

	ConnPullRequestCommits: `query($id: ID!, $cursor: String) {
  node(id: $id) {
    ... on PullRequest { number commits(first: 100, after: $cursor) { ` + pageInfo + ` nodes { commit { oid } } } }
  }
}`,

	ConnPullRequestReviews: `query($id: ID!, $cursor: String) {
  node(id: $id) {
    ... on PullRequest { number reviews(first: 100, after: $cursor) { ` + pageInfo + ` nodes { ...reviewFields } } }
  }
}` + fragmentReview,

	ConnReviewThreads: `query($id: ID!, $cursor: String) {
  node(id: $id) {
    ... on PullRequest { number reviewThreads(first: 50, after: $cursor) { ` + pageInfo + `
      nodes { id reviewComments: comments(first: 100) { ` + pageInfo + ` nodes { ...reviewCommentFields } } }
    } }
  }
}` + fragmentReviewComment,

	ConnThreadComments: `query($id: ID!, $cursor: String) {
  node(id: $id) {
    ... on PullRequestReviewThread { pullRequest { number } reviewComments: comments(first: 100, after: $cursor) { ` + pageInfo + ` nodes { ...reviewCommentFields } } }
  }
}` + fragmentReviewComment,
}
