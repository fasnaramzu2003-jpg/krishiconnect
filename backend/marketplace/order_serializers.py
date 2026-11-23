
from decimal import Decimal

from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ("id", "listing", "listing_title", "unit", "unit_price", "quantity", "line_total")
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source="buyer.username", read_only=True)
    seller_name = serializers.CharField(source="seller.username", read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id", "buyer_name", "seller_name", "status", "total_amount",
            "delivery_address", "contact_phone", "notes", "items", "created_at",
        )
        read_only_fields = fields


class OrderItemInputSerializer(serializers.Serializer):
    listing = serializers.IntegerField(min_value=1)
    quantity = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal("0.01")
    )


class OrderCreateSerializer(serializers.Serializer):
    items = OrderItemInputSerializer(many=True, allow_empty=False, max_length=20)
    delivery_address = serializers.CharField(max_length=500)
    contact_phone = serializers.CharField(max_length=15, required=False, allow_blank=True, default="")
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")


class OrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["confirmed", "delivered", "cancelled"])
