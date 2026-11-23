
from rest_framework import serializers

from .models import MarketPrice


class PriceSerializer(serializers.ModelSerializer):
    crop_name = serializers.CharField(source="crop.name", read_only=True)

    class Meta:
        model = MarketPrice
        fields = [
            "id", "crop", "crop_name", "market_name", "district", "unit", "price",
            "price_date", "source_name", "source_url", "is_demo",
        ]
