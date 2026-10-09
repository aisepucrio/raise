-- name: UpsertRepository :exec
INSERT INTO github_repositories (
    repository_id, github_id, github_node_id, full_name, description, homepage_url, default_branch,
    primary_language, language_bytes, topic_names, license_spdx_id, visibility, is_fork, is_archived,
    is_template, parent_full_name, star_count, watcher_count, fork_count, open_issue_count,
    open_pull_request_count, owner_login, owner_type, label_count, release_count, github_created_at,
    github_updated_at, github_pushed_at, raw_payload
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
          $23, $24, $25, $26, $27, $28, $29)
ON CONFLICT (repository_id) DO UPDATE SET
    github_id               = EXCLUDED.github_id,
    github_node_id          = EXCLUDED.github_node_id,
    full_name               = EXCLUDED.full_name,
    description             = EXCLUDED.description,
    homepage_url            = EXCLUDED.homepage_url,
    default_branch          = EXCLUDED.default_branch,
    primary_language        = EXCLUDED.primary_language,
    language_bytes          = EXCLUDED.language_bytes,
    topic_names             = EXCLUDED.topic_names,
    license_spdx_id         = EXCLUDED.license_spdx_id,
    visibility              = EXCLUDED.visibility,
    is_fork                 = EXCLUDED.is_fork,
    is_archived             = EXCLUDED.is_archived,
    is_template             = EXCLUDED.is_template,
    parent_full_name        = EXCLUDED.parent_full_name,
    star_count              = EXCLUDED.star_count,
    watcher_count           = EXCLUDED.watcher_count,
    fork_count              = EXCLUDED.fork_count,
    open_issue_count        = EXCLUDED.open_issue_count,
    open_pull_request_count = EXCLUDED.open_pull_request_count,
    owner_login             = EXCLUDED.owner_login,
    owner_type              = EXCLUDED.owner_type,
    label_count             = EXCLUDED.label_count,
    release_count           = EXCLUDED.release_count,
    github_created_at       = EXCLUDED.github_created_at,
    github_updated_at       = EXCLUDED.github_updated_at,
    github_pushed_at        = EXCLUDED.github_pushed_at,
    raw_payload             = EXCLUDED.raw_payload,
    last_mined_at           = now()
-- Counts (stars, forks) change without updatedAt moving, so equal timestamps update too.
WHERE github_repositories.github_updated_at <= EXCLUDED.github_updated_at;

-- name: UpsertIssue :batchexec
INSERT INTO github_issues (
    repository_id, number, github_id, github_node_id, title, state, state_reason, author_login,
    author_association, label_names, assignee_logins, milestone_title, is_locked, comment_count,
    reaction_counts, is_pull_request, body, github_created_at, github_updated_at, github_closed_at, raw_payload
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
ON CONFLICT (repository_id, number) DO UPDATE SET
    github_id          = EXCLUDED.github_id,
    github_node_id     = EXCLUDED.github_node_id,
    title              = EXCLUDED.title,
    state              = EXCLUDED.state,
    state_reason       = EXCLUDED.state_reason,
    author_login       = EXCLUDED.author_login,
    author_association = EXCLUDED.author_association,
    label_names        = EXCLUDED.label_names,
    assignee_logins    = EXCLUDED.assignee_logins,
    milestone_title    = EXCLUDED.milestone_title,
    is_locked          = EXCLUDED.is_locked,
    comment_count      = EXCLUDED.comment_count,
    reaction_counts    = EXCLUDED.reaction_counts,
    is_pull_request    = EXCLUDED.is_pull_request,
    body               = EXCLUDED.body,
    github_created_at  = EXCLUDED.github_created_at,
    github_updated_at  = EXCLUDED.github_updated_at,
    github_closed_at   = EXCLUDED.github_closed_at,
    raw_payload        = EXCLUDED.raw_payload,
    last_mined_at      = now()
-- Never overwrite newer data with an older snapshot (batches can run out of order).
WHERE github_issues.github_updated_at <= EXCLUDED.github_updated_at;

-- name: UpsertPullRequest :batchexec
INSERT INTO github_pull_requests (
    repository_id, number, github_id, github_node_id, state, is_draft, is_merged, author_login,
    merged_by_login, head_ref, head_sha, head_repository_full_name, base_ref, base_sha, merge_commit_sha,
    commit_count, files_changed, lines_added, lines_deleted, comment_count, review_count,
    review_thread_count, requested_reviewer_logins, github_created_at, github_updated_at,
    github_closed_at, github_merged_at, raw_payload
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28)
ON CONFLICT (repository_id, number) DO UPDATE SET
    github_id                 = EXCLUDED.github_id,
    github_node_id            = EXCLUDED.github_node_id,
    state                     = EXCLUDED.state,
    is_draft                  = EXCLUDED.is_draft,
    is_merged                 = EXCLUDED.is_merged,
    author_login              = EXCLUDED.author_login,
    merged_by_login           = EXCLUDED.merged_by_login,
    head_ref                  = EXCLUDED.head_ref,
    head_sha                  = EXCLUDED.head_sha,
    head_repository_full_name = EXCLUDED.head_repository_full_name,
    base_ref                  = EXCLUDED.base_ref,
    base_sha                  = EXCLUDED.base_sha,
    merge_commit_sha          = EXCLUDED.merge_commit_sha,
    commit_count              = EXCLUDED.commit_count,
    files_changed             = EXCLUDED.files_changed,
    lines_added               = EXCLUDED.lines_added,
    lines_deleted             = EXCLUDED.lines_deleted,
    comment_count             = EXCLUDED.comment_count,
    review_count              = EXCLUDED.review_count,
    review_thread_count       = EXCLUDED.review_thread_count,
    requested_reviewer_logins = EXCLUDED.requested_reviewer_logins,
    github_created_at         = EXCLUDED.github_created_at,
    github_updated_at         = EXCLUDED.github_updated_at,
    github_closed_at          = EXCLUDED.github_closed_at,
    github_merged_at          = EXCLUDED.github_merged_at,
    raw_payload               = EXCLUDED.raw_payload,
    last_mined_at             = now()
WHERE github_pull_requests.github_updated_at <= EXCLUDED.github_updated_at;

-- name: UpsertPullRequestCommit :batchexec
-- A force push can change the commit at a position.
INSERT INTO github_pull_request_commits (repository_id, pull_request_number, position, sha)
VALUES ($1, $2, $3, $4)
ON CONFLICT (repository_id, pull_request_number, position) DO UPDATE SET sha = EXCLUDED.sha
WHERE github_pull_request_commits.sha <> EXCLUDED.sha;

-- name: TrimPullRequestCommits :batchexec
-- Drops positions beyond the pull request's current commit count (after a force push).
DELETE FROM github_pull_request_commits
WHERE repository_id = $1 AND pull_request_number = $2 AND position >= sqlc.arg(commit_count)::integer;

-- name: UpsertPullRequestReview :batchexec
INSERT INTO github_pull_request_reviews (
    github_id, repository_id, pull_request_number, reviewer_login, author_association, state, body,
    commit_sha, github_submitted_at, github_updated_at, raw_payload
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
ON CONFLICT (github_id) DO UPDATE SET
    repository_id       = EXCLUDED.repository_id,
    pull_request_number = EXCLUDED.pull_request_number,
    reviewer_login      = EXCLUDED.reviewer_login,
    author_association  = EXCLUDED.author_association,
    state               = EXCLUDED.state,
    body                = EXCLUDED.body,
    commit_sha          = EXCLUDED.commit_sha,
    github_submitted_at = EXCLUDED.github_submitted_at,
    github_updated_at   = EXCLUDED.github_updated_at,
    raw_payload         = EXCLUDED.raw_payload,
    last_mined_at       = now()
WHERE github_pull_request_reviews.github_updated_at <= EXCLUDED.github_updated_at;

-- name: UpsertPullRequestReviewComment :batchexec
INSERT INTO github_pull_request_review_comments (
    github_id, repository_id, pull_request_number, review_github_id, in_reply_to_github_id,
    thread_github_node_id, author_login, author_association, path, line, original_line, commit_sha,
    diff_hunk, body, github_created_at, github_updated_at, raw_payload
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
ON CONFLICT (github_id) DO UPDATE SET
    repository_id         = EXCLUDED.repository_id,
    pull_request_number   = EXCLUDED.pull_request_number,
    review_github_id      = EXCLUDED.review_github_id,
    in_reply_to_github_id = EXCLUDED.in_reply_to_github_id,
    thread_github_node_id = EXCLUDED.thread_github_node_id,
    author_login          = EXCLUDED.author_login,
    author_association    = EXCLUDED.author_association,
    path                  = EXCLUDED.path,
    line                  = EXCLUDED.line,
    original_line         = EXCLUDED.original_line,
    commit_sha            = EXCLUDED.commit_sha,
    diff_hunk             = EXCLUDED.diff_hunk,
    body                  = EXCLUDED.body,
    github_created_at     = EXCLUDED.github_created_at,
    github_updated_at     = EXCLUDED.github_updated_at,
    raw_payload           = EXCLUDED.raw_payload,
    last_mined_at         = now()
WHERE github_pull_request_review_comments.github_updated_at <= EXCLUDED.github_updated_at;

-- name: UpsertIssueComment :batchexec
INSERT INTO github_issue_comments (
    github_id, repository_id, issue_number, author_login, author_association, body, reaction_counts,
    github_created_at, github_updated_at, raw_payload
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT (github_id) DO UPDATE SET
    repository_id      = EXCLUDED.repository_id,
    issue_number       = EXCLUDED.issue_number,
    author_login       = EXCLUDED.author_login,
    author_association = EXCLUDED.author_association,
    body               = EXCLUDED.body,
    reaction_counts    = EXCLUDED.reaction_counts,
    github_created_at  = EXCLUDED.github_created_at,
    github_updated_at  = EXCLUDED.github_updated_at,
    raw_payload        = EXCLUDED.raw_payload,
    last_mined_at      = now()
WHERE github_issue_comments.github_updated_at <= EXCLUDED.github_updated_at;

-- name: InsertIssueEvent :batchexec
INSERT INTO github_issue_events (
    github_node_id, repository_id, issue_number, event_type, actor_login, commit_sha, github_created_at, raw_payload
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (github_node_id) DO NOTHING;

-- name: GetRepository :one
SELECT repository_id, github_id, github_node_id, full_name, description, homepage_url, default_branch,
       primary_language, language_bytes, topic_names, license_spdx_id, visibility, is_fork, is_archived,
       is_template, parent_full_name, star_count, watcher_count, fork_count, open_issue_count,
       open_pull_request_count, owner_login, owner_type, label_count, release_count,
       github_created_at, github_updated_at, github_pushed_at, first_mined_at, last_mined_at
FROM github_repositories
WHERE repository_id = $1;

-- name: CountContributors :one
-- GraphQL has no contributor count, so it is computed from the mined commits:
-- distinct GitHub logins, plus the emails of authors without one (GitHub
-- counts those as anonymous contributors).
SELECT count(*)::integer AS commit_count,
       count(DISTINCT coalesce(g.author_login, lower(c.author_email)))::integer AS contributor_count
FROM repository_commits rc
JOIN commits c ON c.sha = rc.sha
LEFT JOIN github_commits g ON g.sha = rc.sha
WHERE rc.repository_id = $1;

-- name: ListIssues :many
SELECT repository_id, number, github_id, title, state, state_reason, author_login, author_association,
       label_names, assignee_logins, milestone_title, is_locked, comment_count, reaction_counts,
       is_pull_request, github_created_at, github_updated_at, github_closed_at, first_mined_at, last_mined_at
FROM github_issues
WHERE repository_id = $1
  AND (sqlc.narg(state)::text IS NULL OR state = sqlc.narg(state))
  AND (sqlc.narg(is_pull_request)::boolean IS NULL OR is_pull_request = sqlc.narg(is_pull_request))
ORDER BY number DESC
LIMIT $2 OFFSET $3;

-- name: GetIssue :one
SELECT repository_id, number, github_id, title, state, state_reason, author_login, author_association,
       label_names, assignee_logins, milestone_title, is_locked, comment_count, reaction_counts,
       is_pull_request, body, github_created_at, github_updated_at, github_closed_at, first_mined_at, last_mined_at
FROM github_issues
WHERE repository_id = $1 AND number = $2;

-- name: ListIssueComments :many
SELECT github_id, issue_number, author_login, author_association, body, reaction_counts,
       github_created_at, github_updated_at, first_mined_at, last_mined_at
FROM github_issue_comments
WHERE repository_id = $1 AND issue_number = $2
ORDER BY github_created_at, github_id;

-- name: ListIssueEvents :many
SELECT github_node_id, issue_number, event_type, actor_login, commit_sha, github_created_at, raw_payload, first_mined_at
FROM github_issue_events
WHERE repository_id = $1 AND issue_number = $2
ORDER BY github_created_at, github_node_id;

-- name: ListPullRequests :many
SELECT p.number, p.github_id, i.title, p.state, p.is_draft, p.is_merged, p.author_login,
       p.merged_by_login, p.head_ref, p.head_sha, p.head_repository_full_name, p.base_ref, p.base_sha,
       p.merge_commit_sha, p.commit_count, p.files_changed, p.lines_added, p.lines_deleted,
       p.comment_count, p.review_count, p.review_thread_count, p.requested_reviewer_logins,
       p.github_created_at, p.github_updated_at, p.github_closed_at, p.github_merged_at,
       p.first_mined_at, p.last_mined_at
FROM github_pull_requests p
JOIN github_issues i ON i.repository_id = p.repository_id AND i.number = p.number
WHERE p.repository_id = $1
  AND (sqlc.narg(state)::text IS NULL OR p.state = sqlc.narg(state))
  AND (sqlc.narg(is_merged)::boolean IS NULL OR p.is_merged = sqlc.narg(is_merged))
ORDER BY p.number DESC
LIMIT $2 OFFSET $3;

-- name: GetPullRequest :one
SELECT p.number, p.github_id, i.title, p.state, p.is_draft, p.is_merged, p.author_login,
       p.merged_by_login, p.head_ref, p.head_sha, p.head_repository_full_name, p.base_ref, p.base_sha,
       p.merge_commit_sha, p.commit_count, p.files_changed, p.lines_added, p.lines_deleted,
       p.comment_count, p.review_count, p.review_thread_count, p.requested_reviewer_logins,
       p.github_created_at, p.github_updated_at, p.github_closed_at, p.github_merged_at,
       p.first_mined_at, p.last_mined_at
FROM github_pull_requests p
JOIN github_issues i ON i.repository_id = p.repository_id AND i.number = p.number
WHERE p.repository_id = $1 AND p.number = $2;

-- name: ListPullRequestCommits :many
SELECT position, sha
FROM github_pull_request_commits
WHERE repository_id = $1 AND pull_request_number = $2
ORDER BY position;

-- name: ListPullRequestReviews :many
SELECT github_id, pull_request_number, reviewer_login, author_association, state, body, commit_sha,
       github_submitted_at, github_updated_at, first_mined_at, last_mined_at
FROM github_pull_request_reviews
WHERE repository_id = $1 AND pull_request_number = $2
ORDER BY github_submitted_at NULLS LAST, github_id;

-- name: ListPullRequestReviewComments :many
SELECT github_id, pull_request_number, review_github_id, in_reply_to_github_id, thread_github_node_id,
       author_login, author_association, path, line, original_line, commit_sha, diff_hunk, body,
       github_created_at, github_updated_at, first_mined_at, last_mined_at
FROM github_pull_request_review_comments
WHERE repository_id = $1 AND pull_request_number = $2
ORDER BY github_created_at, github_id;

-- name: ListUnenrichedCommits :many
-- Mined commits of the repository that have no GitHub view yet.
SELECT rc.sha
FROM repository_commits rc
WHERE rc.repository_id = $1
  AND NOT EXISTS (SELECT 1 FROM github_commits g WHERE g.sha = rc.sha)
ORDER BY rc.sha;

-- name: UpsertCommit :batchexec
-- GitHub's view of a commit has no update timestamp (an email can be linked
-- to an account at any time), so the latest fetch always wins.
INSERT INTO github_commits (sha, github_node_id, author_login, committer_login, is_signature_verified, raw_payload)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (sha) DO UPDATE SET
    github_node_id        = EXCLUDED.github_node_id,
    author_login          = EXCLUDED.author_login,
    committer_login       = EXCLUDED.committer_login,
    is_signature_verified = EXCLUDED.is_signature_verified,
    raw_payload           = EXCLUDED.raw_payload,
    last_mined_at         = now();

-- name: DeleteStaleCommitPullRequests :exec
-- Drops links of the fetched commits that GitHub no longer reports.
DELETE FROM github_commit_pull_requests g
WHERE g.repository_id = sqlc.arg(repository_id)
  AND g.sha = ANY(sqlc.arg(fetched_shas)::text[])
  AND NOT EXISTS (
      SELECT 1
      FROM (SELECT unnest(sqlc.arg(shas)::text[]) AS sha, unnest(sqlc.arg(pull_request_numbers)::integer[]) AS number) n
      WHERE n.sha = g.sha AND n.number = g.pull_request_number
  );

-- name: InsertCommitPullRequests :exec
INSERT INTO github_commit_pull_requests (repository_id, sha, pull_request_number)
SELECT sqlc.arg(repository_id), unnest(sqlc.arg(shas)::text[]), unnest(sqlc.arg(pull_request_numbers)::integer[])
ON CONFLICT DO NOTHING;

-- name: GetCommit :one
SELECT g.sha, g.github_node_id, g.author_login, g.committer_login, g.is_signature_verified,
       g.first_mined_at, g.last_mined_at
FROM github_commits g
JOIN repository_commits rc ON rc.sha = g.sha
WHERE rc.repository_id = $1 AND g.sha = $2;

-- name: ListCommitPullRequestNumbers :many
SELECT pull_request_number
FROM github_commit_pull_requests
WHERE repository_id = $1 AND sha = $2
ORDER BY pull_request_number;
