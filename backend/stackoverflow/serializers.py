from rest_framework import serializers
from .models import StackUser, StackQuestion, StackAnswer, StackComment, StackTag
from .utils import StackDateTimeHandler


class StackUserSerializer(serializers.ModelSerializer):
    creation_date_formatted = serializers.SerializerMethodField()
    last_access_date_formatted = serializers.SerializerMethodField()
    last_modified_date_formatted = serializers.SerializerMethodField()

    class Meta:
        model = StackUser
        fields = "__all__"

    def get_creation_date_formatted(self, obj):
        return StackDateTimeHandler.format_date(obj.creation_date)

    def get_last_access_date_formatted(self, obj):
        return StackDateTimeHandler.format_date(obj.last_access_date)

    def get_last_modified_date_formatted(self, obj):
        return StackDateTimeHandler.format_date(obj.last_modified_date)


class StackTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = StackTag
        fields = "__all__"


class StackQuestionSerializer(serializers.ModelSerializer):
    owner = StackUserSerializer(read_only=True)
    tags = StackTagSerializer(many=True, read_only=True)

    creation_date_formatted = serializers.SerializerMethodField()
    last_activity_date_formatted = serializers.SerializerMethodField()

    class Meta:
        model = StackQuestion
        fields = "__all__"

    def get_creation_date_formatted(self, obj):
        return StackDateTimeHandler.format_date(obj.creation_date)

    def get_last_activity_date_formatted(self, obj):
        return StackDateTimeHandler.format_date(obj.last_activity_date)


class StackAnswerSerializer(serializers.ModelSerializer):
    owner = StackUserSerializer(read_only=True)
    question = StackQuestionSerializer(read_only=True)

    creation_date_formatted = serializers.SerializerMethodField()
    last_activity_date_formatted = serializers.SerializerMethodField()

    class Meta:
        model = StackAnswer
        fields = "__all__"

    def get_creation_date_formatted(self, obj):
        return StackDateTimeHandler.format_date(obj.creation_date)

    def get_last_activity_date_formatted(self, obj):
        return StackDateTimeHandler.format_date(obj.last_activity_date)


class StackCommentSerializer(serializers.ModelSerializer):
    owner = StackUserSerializer(read_only=True)

    creation_date_formatted = serializers.SerializerMethodField()

    class Meta:
        model = StackComment
        fields = "__all__"

    def get_creation_date_formatted(self, obj):
        return StackDateTimeHandler.format_date(obj.creation_date)


ALLOWED_MODES = {"default", "advanced"}
STACKOVERFLOW_COLLECT_TYPES = ("questions",)


class StackOverflowCollectFiltersSerializer(serializers.Serializer):
    min = serializers.IntegerField(required=False)
    max = serializers.IntegerField(required=False)
    accepted = serializers.BooleanField(required=False)
    answers = serializers.IntegerField(required=False)
    views = serializers.IntegerField(required=False)
    intitle = serializers.CharField(required=False, allow_blank=False)
    closed = serializers.BooleanField(required=False)
    migrated = serializers.BooleanField(required=False)
    nottagged = serializers.CharField(required=False, allow_blank=False)
    user = serializers.CharField(required=False, allow_blank=False)


class StackOverflowCollectOptionsSerializer(serializers.Serializer):
    mode = serializers.ChoiceField(choices=tuple(sorted(ALLOWED_MODES)), default="default", required=False)


class StackOverflowCollectSerializer(serializers.Serializer):
    targets = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    collect_types = serializers.ListField(
        child=serializers.ChoiceField(choices=STACKOVERFLOW_COLLECT_TYPES),
        required=True,
    )
    start_date = serializers.CharField(required=True, allow_blank=False)
    end_date = serializers.CharField(required=True, allow_blank=False)
    filters = StackOverflowCollectFiltersSerializer(required=False, default=dict)
    options = StackOverflowCollectOptionsSerializer(required=False, default=dict)

    def validate_collect_types(self, value):
        if value != ["questions"]:
            raise serializers.ValidationError("Stack Overflow only supports collect_types ['questions'].")
        return value


class ExportStackoverflowDataSerializer(serializers.Serializer):
    format = serializers.ChoiceField(choices=["csv", "json"], default="csv")
    ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="IDs específicos a exportar",
    )
    min_score = serializers.IntegerField(
        required=False,
        help_text="Filtrar perguntas com score mínimo",
    )
