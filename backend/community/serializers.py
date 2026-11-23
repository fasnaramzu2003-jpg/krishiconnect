
from rest_framework import serializers

from crops.models import Crop

from .models import Answer, Question


class AnswerSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True)
    is_expert = serializers.SerializerMethodField()

    class Meta:
        model = Answer
        fields = ["id", "body", "author_name", "is_expert", "is_accepted", "created_at"]

    def get_is_expert(self, obj):
        return obj.author.role == "expert" and obj.author.is_verified


class AnswerCreateSerializer(serializers.Serializer):
    body = serializers.CharField(min_length=3, max_length=2000)


class ReportSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=5, max_length=300)


class QuestionSerializer(serializers.ModelSerializer):
    title = serializers.CharField(min_length=5, max_length=150)
    body = serializers.CharField(min_length=5, max_length=2000)
    crop = serializers.PrimaryKeyRelatedField(
        queryset=Crop.objects.all(), required=False, allow_null=True
    )
    crop_name = serializers.CharField(source="crop.name", read_only=True, default="")
    author_name = serializers.CharField(source="author.username", read_only=True)
    answers_count = serializers.SerializerMethodField()
    has_accepted = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            "id", "title", "body", "crop", "crop_name", "district", "author_name",
            "created_at", "answers_count", "has_accepted",
        ]

    def get_answers_count(self, obj):
        value = getattr(obj, "answers_count", None)
        if value is not None:
            return value
        return obj.answers.filter(is_hidden=False).count()

    def get_has_accepted(self, obj):
        value = getattr(obj, "accepted", None)
        if value is not None:
            return value > 0
        return obj.answers.filter(is_hidden=False, is_accepted=True).exists()


class QuestionDetailSerializer(QuestionSerializer):
    answers = serializers.SerializerMethodField()

    class Meta(QuestionSerializer.Meta):
        fields = QuestionSerializer.Meta.fields + ["answers"]

    def get_answers(self, obj):
        rows = (
            obj.answers.filter(is_hidden=False)
            .select_related("author")
            .order_by("-is_accepted", "created_at")
        )
        return AnswerSerializer(rows, many=True).data
