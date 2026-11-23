
from decimal import Decimal, InvalidOperation

from django.db.models import Q
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from core.permissions import IsFarmer

from .models import ListingImage, ProductListing
from .permissions import IsSellerOrReadOnly
from .serializers import ListingImageSerializer, ProductListingSerializer

ORDERINGS = {
    "price": "price_per_unit",
    "-price": "-price_per_unit",
    "newest": "-created_at",
}


def to_decimal(value):
    try:
        return Decimal(value)
    except (InvalidOperation, TypeError):
        return None


class ListingViewSet(viewsets.ModelViewSet):
    serializer_class = ProductListingSerializer
    permission_classes = [IsSellerOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        params = self.request.query_params
        queryset = ProductListing.objects.select_related(
            "crop", "seller"
        ).prefetch_related("images")

        if params.get("mine") == "true" and user.is_authenticated:
            queryset = queryset.filter(seller=user)
        elif self.action in ("list", "retrieve"):
            queryset = queryset.filter(status="active")
        elif user.is_authenticated:
            queryset = queryset.filter(seller=user)
        else:
            return queryset.none()

        search = params.get("search")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(crop__name__icontains=search)
                | Q(district__icontains=search)
            )
        if params.get("crop", "").isdigit():
            queryset = queryset.filter(crop_id=int(params["crop"]))
        if params.get("district"):
            queryset = queryset.filter(district__iexact=params["district"])
        min_price = to_decimal(params.get("min_price"))
        if min_price is not None:
            queryset = queryset.filter(price_per_unit__gte=min_price)
        max_price = to_decimal(params.get("max_price"))
        if max_price is not None:
            queryset = queryset.filter(price_per_unit__lte=max_price)

        return queryset.order_by(ORDERINGS.get(params.get("ordering"), "-created_at"))

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)


class ListingImageViewSet(
    mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    serializer_class = ListingImageSerializer
    permission_classes = [IsFarmer, IsAuthenticated]

    def get_queryset(self):
        return ListingImage.objects.filter(listing__seller=self.request.user)
