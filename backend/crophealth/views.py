
from django.core.files.base import ContentFile
from rest_framework import mixins, status, viewsets
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from assistant.groq_client import AssistantError
from core.permissions import IsFarmer

from .models import CropHealthReport
from .serializers import CreateSerializer, ReportSerializer
from .services import analyze, prepare_image


class VisionThrottle(UserRateThrottle):
    rate = "10/hour"


class CropHealthViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    serializer_class = ReportSerializer
    permission_classes = [IsFarmer]

    def get_throttles(self):
        return [VisionThrottle()] if self.action == "create" else []

    def get_queryset(self):
        return CropHealthReport.objects.filter(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        data = CreateSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        info = data.validated_data
        jpeg = prepare_image(info["image"])
        try:
            analysis = analyze(
                jpeg, info["crop_name"], info.get("symptoms_note", ""), info["language"]
            )
        except AssistantError as err:
            return Response({"detail": str(err)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        report = CropHealthReport(
            owner=request.user,
            crop_name=info["crop_name"],
            symptoms_note=info.get("symptoms_note", ""),
            language=info["language"],
            analysis=analysis,
        )
        report.image.save("photo.jpg", ContentFile(jpeg), save=False)
        report.save()
        out = ReportSerializer(report, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)
