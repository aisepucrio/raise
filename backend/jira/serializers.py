from rest_framework import serializers

from .models import JiraIssue, JiraProject, JiraUser, JiraSprint, JiraComment, JiraChecklist, JiraIssueType, JiraIssueLink, JiraCommit, JiraActivityLog, JiraHistory, JiraHistoryItem

class JiraIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = JiraIssue
        fields = '__all__'

class JiraProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = JiraProject
        fields = '__all__'

class JiraUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = JiraUser
        fields = '__all__'

class JiraSprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = JiraSprint
        fields = '__all__'

class JiraCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = JiraComment
        fields = '__all__'

class JiraChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = JiraChecklist
        fields = '__all__'

class JiraIssueTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = JiraIssueType
        fields = '__all__'

class JiraIssueLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = JiraIssueLink
        fields = '__all__'

class JiraCommitSerializer(serializers.ModelSerializer):
    class Meta:
        model = JiraCommit
        fields = '__all__'

class JiraActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = JiraActivityLog
        fields = '__all__'

class JiraHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = JiraHistory
        fields = '__all__'

class JiraHistoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = JiraHistoryItem
        fields = '__all__'

JIRA_COLLECT_TYPES = ("issues",)


class JiraCollectFiltersSerializer(serializers.Serializer):
    types = serializers.ListField(child=serializers.CharField(), required=False, default=list)


class JiraCollectSerializer(serializers.Serializer):
    targets = serializers.ListField(child=serializers.CharField(), required=True)
    collect_types = serializers.ListField(
        child=serializers.ChoiceField(choices=JIRA_COLLECT_TYPES),
        required=True,
    )
    start_date = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    end_date = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    filters = JiraCollectFiltersSerializer(required=False, default=dict)
    options = serializers.DictField(required=False, default=dict)

    def validate_targets(self, value):
        if not value:
            raise serializers.ValidationError("At least one target must be provided.")

        for target in value:
            if "/" not in target:
                raise serializers.ValidationError("Each target must use jira_domain/project_key format.")

            jira_domain, project_key = target.split("/", 1)
            if not jira_domain or not project_key:
                raise serializers.ValidationError("Each target must use jira_domain/project_key format.")

        return value

    def validate_collect_types(self, value):
        if not value:
            raise serializers.ValidationError("At least one collect type must be selected.")
        if value != ["issues"]:
            raise serializers.ValidationError("Jira only supports collect_types ['issues'].")
        return value

class ExportDataSerializer(serializers.Serializer):
    table = serializers.CharField()
    format = serializers.ChoiceField(choices=['json', 'csv'])  
    ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, allow_empty=True
    )
    issue_type = serializers.CharField(required=False, allow_blank=True)
    data_type = serializers.CharField(required=False, allow_blank=True)  
