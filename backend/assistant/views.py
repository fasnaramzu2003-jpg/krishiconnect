
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from crops.models import FarmCrop

from .groq_client import AssistantError, chat

SYSTEM_PROMPT = (
    "You are KrishiConnect AI, a farming assistant for farmers in Kerala, India. "
    "Give practical, simple advice about crops, soil, water, pests, diseases and "
    "selling produce. Rules: never invent market prices, government scheme details "
    "or pesticide doses. If you are not sure, say so plainly. For pesticide or "
    "disease treatment, tell the farmer to confirm with the local Krishi Bhavan or "
    "Kerala Agricultural University (KAU) before spraying. Keep answers under 150 "
    "words, in simple words."
)

DISCLAIMER = "AI-generated advice. Please confirm with your local Krishi Bhavan or KAU."


class AssistantThrottle(UserRateThrottle):
    rate = "20/hour"


class HistoryItem(serializers.Serializer):
    role = serializers.ChoiceField(choices=["user", "assistant"])
    content = serializers.CharField(max_length=2000)


class AskSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=1000)
    language = serializers.ChoiceField(choices=["en", "ml"], default="en")
    history = HistoryItem(many=True, required=False, max_length=6)


def farm_context(user):
    rows = FarmCrop.objects.filter(farm__owner=user).select_related("farm", "crop")[:10]
    parts = [f"{r.crop.name} at {r.farm.name} ({r.farm.district})" for r in rows]
    if not parts:
        return ""
    return (
        "Background only: this farmer's registered crops are: " + "; ".join(parts) + "."
    )


class AskView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AssistantThrottle]

    def post(self, request):
        data = AskSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        info = data.validated_data

        system = SYSTEM_PROMPT
        if info["language"] == "ml":
            system += " Reply in Malayalam script."
        else:
            system += " Reply in simple English."
        context = farm_context(request.user)
        if context:
            system += " " + context

        messages = [{"role": "system", "content": system}]
        for item in info.get("history", []):
            messages.append({"role": item["role"], "content": item["content"]})
        messages.append({"role": "user", "content": info["question"]})

        try:
            answer = chat(messages)
        except AssistantError as err:
            return Response({"detail": str(err)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"answer": answer, "disclaimer": DISCLAIMER})


