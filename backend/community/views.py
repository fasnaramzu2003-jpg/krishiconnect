
from django.db import transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from .models import Answer, Question, Report
from .serializers import (
    AnswerCreateSerializer,
    QuestionDetailSerializer,
    QuestionSerializer,
    ReportSerializer,
)

THANKS = "Thank you. A moderator will review this."


class QuestionThrottle(UserRateThrottle):
    rate = "10/hour"


class AnswerThrottle(UserRateThrottle):
    rate = "30/hour"


class ReportThrottle(UserRateThrottle):
    rate = "20/hour"


class QuestionViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_throttles(self):
        mapping = {
            "create": QuestionThrottle,
            "answers": AnswerThrottle,
            "report": ReportThrottle,
        }
        cls = mapping.get(self.action)
        return [cls()] if cls else []

    def get_serializer_class(self):
        return QuestionDetailSerializer if self.action == "retrieve" else QuestionSerializer

    def get_queryset(self):
        qs = (
            Question.objects.filter(is_hidden=False)
            .select_related("author", "crop")
            .annotate(
                answers_count=Count("answers", filter=Q(answers__is_hidden=False)),
                accepted=Count(
                    "answers",
                    filter=Q(answers__is_hidden=False, answers__is_accepted=True),
                ),
            )
        )
        if self.action == "list":
            p = self.request.query_params
            if p.get("crop", "").isdigit():
                qs = qs.filter(crop_id=p["crop"])
            if p.get("district"):
                qs = qs.filter(district__iexact=p["district"])
            if p.get("q"):
                qs = qs.filter(Q(title__icontains=p["q"]) | Q(body__icontains=p["q"]))
            if p.get("unanswered") == "true":
                qs = qs.filter(answers_count=0)
            if p.get("mine") == "true" and self.request.user.is_authenticated:
                qs = qs.filter(author=self.request.user)
        return qs.order_by("-created_at","-id")

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def _detail(self, pk, status_code=200):
        obj = self.get_queryset().get(pk=pk)
        data = QuestionDetailSerializer(obj, context={"request": self.request}).data
        return Response(data, status=status_code)

    @action(detail=True, methods=["post"])
    def answers(self, request, pk=None):
        question = self.get_object()
        data = AnswerCreateSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        Answer.objects.create(
            question=question, author=request.user, body=data.validated_data["body"]
        )
        return self._detail(question.pk, status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def accept(self, request, pk=None):
        question = self.get_object()
        if question.author_id != request.user.id:
            raise PermissionDenied("Only the person who asked can accept an answer.")
        answer_id = str(request.data.get("answer", ""))
        if not answer_id.isdigit():
            raise ValidationError({"answer": ["Choose an answer."]})
        answer = get_object_or_404(
            Answer, pk=answer_id, question=question, is_hidden=False
        )
        Answer.objects.filter(question=question).update(is_accepted=False)
        answer.is_accepted = True
        answer.save(update_fields=["is_accepted"])
        return self._detail(question.pk)

    @action(detail=True, methods=["post"])
    def report(self, request, pk=None):
        question = self.get_object()
        data = ReportSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        if question.author_id == request.user.id:
            raise ValidationError({"detail": "You cannot report your own question."})
        Report.objects.get_or_create(
            reporter=request.user,
            question=question,
            defaults={"reason": data.validated_data["reason"]},
        )
        return Response({"detail": THANKS}, status=status.HTTP_201_CREATED)


class AnswerReportView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ReportThrottle]

    def post(self, request, pk):
        answer = get_object_or_404(Answer, pk=pk, is_hidden=False, question__is_hidden=False)
        data = ReportSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        if answer.author_id == request.user.id:
            raise ValidationError({"detail": "You cannot report your own answer."})
        Report.objects.get_or_create(
            reporter=request.user,
            answer=answer,
            defaults={"reason": data.validated_data["reason"]},
        )
        return Response({"detail": THANKS}, status=status.HTTP_201_CREATED)
