
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from core.stats import AdminStatsView
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("farms.urls")),
    path("api/", include("crops.urls")),
    path("api/", include("marketplace.urls")),
    path("api/", include("groupselling.urls")),
    path("api/assistant/", include("assistant.urls")),
    path("api/", include("crophealth.urls")),
    path("api/market/", include("market.urls")),
    path("api/community/", include("community.urls")),
    path("api/notification/", include("notification.urls")),
    path("api/admin-stats/", AdminStatsView.as_view()),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
