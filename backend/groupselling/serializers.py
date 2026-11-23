
from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from .models import GroupSaleRequest


class GroupSaleRequestSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source="buyer.username", read_only=True)
    crop_name = serializers.CharField(source="crop.name", read_only=True)
    quantity_filled = serializers.SerializerMethodField()
    quantity_remaining = serializers.SerializerMethodField()
    farmers_count = serializers.SerializerMethodField()
    my_pledge = serializers.SerializerMethodField()

    class Meta:
        model = GroupSaleRequest
        fields = [
            "id", "buyer_name", "crop", "crop_name", "title", "description",
            "quantity_needed", "unit", "offered_price_per_unit", "district",
            "deadline", "status", "created_at", "quantity_filled",
            "quantity_remaining", "farmers_count", "my_pledge",
        ]
        read_only_fields = ["status", "created_at"]

    def _filled(self, obj):
        value = getattr(obj, "filled", None)
        return obj.filled_quantity() if value is None else value

    def get_quantity_filled(self, obj):
        return str(self._filled(obj))

    def get_quantity_remaining(self, obj):
        return str(max(obj.quantity_needed - self._filled(obj), Decimal("0")))

    def get_farmers_count(self, obj):
        value = getattr(obj, "farmers", None)
        return obj.contributions.count() if value is None else value

    def get_my_pledge(self, obj):
        user = self.context["request"].user
        pledge = obj.contributions.filter(farmer=user).first()
        if pledge is None:
            return None
        return {"quantity": str(pledge.quantity), "status": pledge.status}

    def validate_deadline(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError("The deadline cannot be in the past.")
        return value


class ContributeSerializer(serializers.Serializer):
    quantity = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal("0.01")
    )
    note = serializers.CharField(max_length=200, required=False, allow_blank=True)
