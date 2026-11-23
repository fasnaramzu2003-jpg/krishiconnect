
from decimal import Decimal

from django.db.models import Count, DecimalField, Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import IsBuyer, IsFarmer

from . import services
from .models import GroupSaleContribution, GroupSaleRequest
from .serializers import ContributeSerializer, GroupSaleRequestSerializer


class GroupSaleRequestViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = GroupSaleRequestSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsBuyer()]
        if self.action in ("contribute", "withdraw"):
            return [IsFarmer()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = GroupSaleRequest.objects.select_related("buyer", "crop").annotate(
            filled=Coalesce(
                Sum("contributions__quantity"),
                Value(Decimal("0")),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            ),
            farmers=Count("contributions"),
        )
        params = self.request.query_params
        user = self.request.user
        if self.action == "list":
            if params.get("mine") == "true":
                qs = qs.filter(buyer=user)
            elif params.get("contributed") == "true":
                mine = GroupSaleContribution.objects.filter(farmer=user)
                qs = qs.filter(id__in=mine.values("request_id"))
            else:
                qs = qs.filter(
                    status=GroupSaleRequest.Status.OPEN,
                    deadline__gte=timezone.localdate(),
                )
            if params.get("district"):
                qs = qs.filter(district__iexact=params["district"])
            if params.get("crop"):
                qs = qs.filter(crop_id=params["crop"])
        return qs

    def perform_create(self, serializer):
        serializer.save(buyer=self.request.user)

    def _fresh(self, pk, status_code=200):
        obj = self.get_queryset().get(pk=pk)
        return Response(self.get_serializer(obj).data, status=status_code)

    @action(detail=True, methods=["post"])
    def contribute(self, request, pk=None):
        data = ContributeSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        services.contribute(
            pk, request.user, data.validated_data["quantity"],
            data.validated_data.get("note", ""),
        )
        return self._fresh(pk, 201)

    @action(detail=True, methods=["post"])
    def withdraw(self, request, pk=None):
        services.withdraw(pk, request.user)
        return self._fresh(pk)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        services.cancel_request(pk, request.user)
        return self._fresh(pk)
