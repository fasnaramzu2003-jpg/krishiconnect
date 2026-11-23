
from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import AnswerReportView, QuestionViewSet

router = SimpleRouter()
router.register("questions", QuestionViewSet, basename="question")

urlpatterns = router.urls + [
    path("answers/<int:pk>/report/", AnswerReportView.as_view()),
]
