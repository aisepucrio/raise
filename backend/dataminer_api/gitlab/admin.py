from django.contrib import admin

from .models import (
    GitLabAuthor,
    GitLabBranch,
    GitLabCommit,
    GitLabIssue,
    GitLabIssueExtra,
    GitLabMergeRequest,
    GitLabMergeRequestExtra,
    GitLabMetadata,
    GitLabModifiedFile,
    GitLabProjectExtra,
)


admin.site.register(GitLabAuthor)
admin.site.register(GitLabCommit)
admin.site.register(GitLabModifiedFile)
admin.site.register(GitLabIssue)
admin.site.register(GitLabMergeRequest)
admin.site.register(GitLabBranch)
admin.site.register(GitLabMetadata)
admin.site.register(GitLabProjectExtra)
admin.site.register(GitLabMergeRequestExtra)
admin.site.register(GitLabIssueExtra)
