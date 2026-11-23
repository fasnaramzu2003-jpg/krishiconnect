
from rest_framework import serializers

from .models import CropHealthReport

MAX_BYTES = 8 * 1024 * 1024
DISCLAIMER = (
    "AI looked at a photo only. This is not a diagnosis. Show the plant to your "
    "local Krishi Bhavan or KAU/KVK expert before spraying."
)


class CreateSerializer(serializers.Serializer):
    image = serializers.ImageField()
    crop_name = serializers.CharField(max_length=100)
    symptoms_note = serializers.CharField(max_length=500, required=False, allow_blank=True)
    language = serializers.ChoiceField(choices=["en", "ml"], default="en")

    def validate_image(self, value):
        if value.size > MAX_BYTES:
            raise serializers.ValidationError("The photo must be 8 MB or smaller.")
        return value


class ReportSerializer(serializers.ModelSerializer):
    disclaimer = serializers.SerializerMethodField()

    class Meta:
        model = CropHealthReport
        fields = [
            "id", "crop_name", "symptoms_note", "language", "image",
            "analysis", "created_at", "disclaimer",
        ]

    def get_disclaimer(self, obj):
        return DISCLAIMER
