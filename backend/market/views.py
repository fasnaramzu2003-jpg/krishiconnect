
from datetime import timedelta

from django.db.models import Avg, Count, Max, Min
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import MarketPrice
from .serializers import PriceSerializer


class PriceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PriceSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = MarketPrice.objects.select_related("crop")
        p = self.request.query_params
        if p.get("crop", "").isdigit():
            qs = qs.filter(crop_id=p["crop"])
        if p.get("district"):
            qs = qs.filter(district__iexact=p["district"])
        if p.get("market"):
            qs = qs.filter(market_name__icontains=p["market"])
        return qs.order_by("-price_date", "crop__name")

    @action(detail=False, methods=["get"])
    def trends(self, request):
        p = request.query_params
        if not p.get("crop", "").isdigit():
            return Response({"detail": "Choose a crop."}, status=400)
        days = int(p["days"]) if p.get("days", "").isdigit() else 90
        days = max(7, min(days, 365))
        since = timezone.localdate() - timedelta(days=days)

        qs = MarketPrice.objects.filter(crop_id=p["crop"], price_date__gte=since)
        if p.get("district"):
            qs = qs.filter(district__iexact=p["district"])
        latest = qs.order_by("-price_date").first()
        if latest is None:
            return Response(
                {"points": [], "note": "No price entries for this crop in this period."}
            )
        unit = p.get("unit") if p.get("unit") in ("kg", "quintal") else latest.unit
        qs = qs.filter(unit=unit)

        rows = (
            qs.values("price_date")
            .annotate(avg=Avg("price"), low=Min("price"), high=Max("price"), n=Count("id"))
            .order_by("price_date")
        )
        points = [
            {
                "date": str(r["price_date"]),
                "avg": f"{r['avg']:.2f}",
                "low": str(r["low"]),
                "high": str(r["high"]),
                "entries": r["n"],
            }
            for r in rows
        ]
        change = None
        if len(points) >= 2 and float(points[0]["avg"]) > 0:
            first, last = float(points[0]["avg"]), float(points[-1]["avg"])
            change = round((last - first) / first * 100, 1)

        return Response(
            {
                "crop_name": latest.crop.name,
                "unit": unit,
                "days": days,
                "points": points,
                "change_percent": change,
                "entries": qs.count(),
                "markets": qs.values("market_name").distinct().count(),
                "sources": list(qs.values_list("source_name", flat=True).distinct()),
                "has_demo": qs.filter(is_demo=True).exists(),
                "note": "Prices are entered from the listed sources. This is not a forecast.",
            }
        )
