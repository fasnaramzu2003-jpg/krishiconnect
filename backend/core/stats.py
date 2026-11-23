
from django.contrib.auth import get_user_model
from django.db.models import Count
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from community.models import Question, Report
from crophealth.models import CropHealthReport
from groupselling.models import GroupSaleRequest
from market.models import MarketPrice
from marketplace.models import Order, ProductListing


def counts(model, field):
    rows = model.objects.values(field).annotate(n=Count("id"))
    return {row[field]: row["n"] for row in rows}


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        User = get_user_model()
        return Response(
            {
                "users_by_role": counts(User, "role"),
                "unverified_experts": User.objects.filter(
                    role="expert", is_verified=False
                ).count(),
                "listings_by_status": counts(ProductListing, "status"),
                "orders_by_status": counts(Order, "status"),
                "group_requests_by_status": counts(GroupSaleRequest, "status"),
                "questions": Question.objects.count(),
                "open_reports": Report.objects.filter(resolved=False).count(),
                "health_reports": CropHealthReport.objects.count(),
                "market_prices": MarketPrice.objects.count(),
                "demo_prices": MarketPrice.objects.filter(is_demo=True).count(),
            }
        )
