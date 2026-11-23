
from django.conf import settings
from django.db import models


class Question(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="questions"
    )
    title = models.CharField(max_length=150)
    body = models.TextField()
    crop = models.ForeignKey("crops.Crop", null=True, blank=True, on_delete=models.SET_NULL)
    district = models.CharField(max_length=80, blank=True)
    is_hidden = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="answers")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="answers"
    )
    body = models.TextField()
    is_accepted = models.BooleanField(default=False)
    is_hidden = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Answer to {self.question_id} by {self.author}"


class Report(models.Model):
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, null=True, blank=True, on_delete=models.CASCADE)
    answer = models.ForeignKey(Answer, null=True, blank=True, on_delete=models.CASCADE)
    reason = models.CharField(max_length=300)
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["resolved", "-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(question__isnull=False, answer__isnull=True)
                    | models.Q(question__isnull=True, answer__isnull=False)
                ),
                name="report_has_one_target",
            ),
            models.UniqueConstraint(
                fields=["reporter", "question"], name="one_report_per_question"
            ),
            models.UniqueConstraint(
                fields=["reporter", "answer"], name="one_report_per_answer"
            ),
        ]
