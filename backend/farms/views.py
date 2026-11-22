
from django.db.models import Count
from rest_framework import viewsets

from core.permissions import IsFarmer

from .models import Farm, Field
from .serializers import FarmSerializer, FieldSerializer


class FarmViewSet(viewsets.ModelViewSet):
    serializer_class = FarmSerializer
    permission_classes = [IsFarmer]

    def get_queryset(self):
        queryset = Farm.objects.filter(owner=self.request.user).annotate(
            fields_count=Count("fields")
        )
        district = self.request.query_params.get("district")
        if district:
            queryset = queryset.filter(district__iexact=district)
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class FieldViewSet(viewsets.ModelViewSet):
    serializer_class = FieldSerializer
    permission_classes = [IsFarmer]

    def get_queryset(self):
        queryset = Field.objects.filter(farm__owner=self.request.user).select_related("farm")
        farm_id = self.request.query_params.get("farm")
        if farm_id:
            queryset = queryset.filter(farm_id=farm_id)
        return queryset
