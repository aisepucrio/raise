package git

import "raise/internal/platform"

var _ platform.DatasetProvider = (*Platform)(nil)

// Datasets are git's tables as previews and exports. Commits and their files
// are listed once per repository that contains them, so forks repeat them,
// each with its repository_id.
func (p *Platform) Datasets() []platform.Dataset {
	return []platform.Dataset{
		{
			Name: "repositories",
			Doc:  "Registered repositories.",
			From: "repositories",
			Columns: []platform.Column{
				platform.IntCol("id"),
				platform.TextCol("url").Searchable(),
				platform.TextCol("host"),
				platform.TextCol("path").Searchable(),
				platform.TimeCol("mirror_last_synced_at"),
				platform.TimeCol("created_at"),
			},
			TimeColumn: "created_at",
			Key:        []string{"id"},
		},
		{
			Name: "commits",
			Doc:  "Mined commits, one row per repository that contains them.",
			From: "repository_commits rc JOIN commits c ON c.sha = rc.sha",
			Columns: []platform.Column{
				platform.IntCol("repository_id").Expression("rc.repository_id"),
				platform.TextCol("sha").Expression("c.sha"),
				platform.TextArrayCol("parent_shas"),
				platform.BoolCol("is_merge").Expression("cardinality(c.parent_shas) > 1").
					Describe("Computed: whether the commit has two or more parents"),
				platform.TextCol("author_name").Searchable(),
				platform.TextCol("author_email").Searchable(),
				platform.TimeCol("authored_at"),
				platform.TextCol("committer_name").Searchable(),
				platform.TextCol("committer_email").Searchable(),
				platform.TimeCol("committed_at"),
				platform.LongTextCol("message"),
				platform.IntCol("lines_added").Expression("c.lines_added"),
				platform.IntCol("lines_deleted").Expression("c.lines_deleted"),
				platform.IntCol("files_changed"),
				platform.TimeCol("first_mined_at"),
			},
			TimeColumn: "authored_at",
			Key:        []string{"repository_id", "sha"},
		},
		{
			Name: "commit-files",
			Doc:  "Files changed by each non-merge commit, one row per repository that contains the commit.",
			From: "repository_commits rc JOIN commits c ON c.sha = rc.sha JOIN commit_files f ON f.sha = rc.sha",
			Columns: []platform.Column{
				platform.IntCol("repository_id").Expression("rc.repository_id"),
				platform.TextCol("sha").Expression("f.sha"),
				platform.TimeCol("authored_at").Expression("c.authored_at").Describe("The commit's author date"),
				platform.TextCol("path").Expression("f.path").Searchable(),
				platform.TextCol("previous_path").Searchable(),
				platform.TextCol("change_type").Values("added", "modified", "deleted", "renamed", "copied", "type_changed", "unmerged"),
				platform.IntCol("similarity_percent"),
				platform.IntCol("lines_added").Expression("f.lines_added").Describe("Null for binary files"),
				platform.IntCol("lines_deleted").Expression("f.lines_deleted").Describe("Null for binary files"),
			},
			TimeColumn: "authored_at",
			Key:        []string{"repository_id", "sha", "path"},
		},
		{
			Name: "commit-diffs",
			Doc: "Text diffs of the files changed by each non-merge commit, one row per repository that contains the commit. " +
				"Mined only by collections with diffs: true.",
			From: "repository_commits rc JOIN commits c ON c.sha = rc.sha JOIN commit_file_diffs d ON d.sha = rc.sha " +
				"JOIN commit_files f ON f.sha = d.sha AND f.path = d.path",
			Columns: []platform.Column{
				platform.IntCol("repository_id").Expression("rc.repository_id"),
				platform.TextCol("sha").Expression("d.sha"),
				platform.TimeCol("authored_at").Expression("c.authored_at").Describe("The commit's author date"),
				platform.TextCol("path").Expression("d.path").Searchable(),
				platform.TextCol("previous_path").Expression("f.previous_path").Searchable(),
				platform.TextCol("change_type").Expression("f.change_type").
					Values("added", "modified", "deleted", "renamed", "copied", "type_changed", "unmerged"),
				{Name: "diff", Type: platform.ColText, Expr: "d.diff", NoFilter: true,
					Doc: "Unified diff hunks, from the first @@ line; null for binary files, mode changes and pure renames"},
				platform.IntCol("diff_size_bytes").Describe("Size of the whole diff, before truncation"),
				platform.BoolCol("is_diff_truncated").Describe("The diff was cut at a line boundary, past 1 MiB per file or 32 MiB per commit"),
				platform.TimeCol("first_mined_at").Expression("d.first_mined_at"),
			},
			TimeColumn: "authored_at",
			Key:        []string{"repository_id", "sha", "path"},
		},
		{
			Name: "refs",
			Doc:  "Branch and tag tips seen when each repository's commits were last planned.",
			From: "repository_refs",
			Columns: []platform.Column{
				platform.IntCol("repository_id"),
				platform.TextCol("name").Searchable(),
				platform.TextCol("kind").
					Expression("CASE WHEN name LIKE 'refs/heads/%' THEN 'branch' WHEN name LIKE 'refs/tags/%' THEN 'tag' ELSE 'other' END").
					Describe("Computed from name").Values("branch", "tag", "other"),
				platform.TextCol("commit_sha"),
				platform.TimeCol("last_seen_at"),
			},
			Key: []string{"repository_id", "name"},
		},
	}
}
