
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from core.permissions import IsFarmer

from .models import Crop, CropActivity, FarmCrop
from .serializers import CropActivitySerializer, CropSerializer, FarmCropSerializer


class CropViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Crop.objects.all()
    serializer_class = CropSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


class FarmCropViewSet(viewsets.ModelViewSet):
    serializer_class = FarmCropSerializer
    permission_classes = [IsFarmer]

    def get_queryset(self):
        queryset = FarmCrop.objects.filter(farm__owner=self.request.user).select_related(
            "crop", "farm", "field"
        )
        farm_id = self.request.query_params.get("farm")
        if farm_id:
            queryset = queryset.filter(farm_id=farm_id)
        return queryset


class CropActivityViewSet(viewsets.ModelViewSet):
    serializer_class = CropActivitySerializer
    permission_classes = [IsFarmer]

    def get_queryset(self):
        queryset = CropActivity.objects.filter(
            farm_crop__farm__owner=self.request.user
        ).select_related("farm_crop")
        farm_crop_id = self.request.query_params.get("farm_crop")
        if farm_crop_id:
            queryset = queryset.filter(farm_crop_id=farm_crop_id)
        return queryset
