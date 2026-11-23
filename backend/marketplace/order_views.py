
from django.db.models import Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Order
from .order_serializers import (
    OrderCreateSerializer,
    OrderSerializer,
    OrderStatusSerializer,
)
from .services import change_order_status, place_order


class OrderViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Order.objects.select_related("buyer", "seller").prefetch_related("items")
        if self.action == "list":
            if self.request.query_params.get("as") == "seller":
                return queryset.filter(seller=user)
            return queryset.filter(buyer=user)
        return queryset.filter(Q(buyer=user) | Q(seller=user))

    def create(self, request, *args, **kwargs):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = place_order(request.user, **serializer.validated_data)
        order = self.get_queryset().get(pk=order.pk)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="status")
    def set_status(self, request, pk=None):
        if not str(pk).isdigit():
            raise NotFound("Order not found.")
        serializer = OrderStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = change_order_status(pk, request.user, serializer.validated_data["status"])
        order = self.get_queryset().get(pk=order.pk)
        return Response(OrderSerializer(order).data)
