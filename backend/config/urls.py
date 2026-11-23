
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("farms.urls")),
    path("api/", include("crops.urls")),
    path("api/", include("marketplace.urls")),
    path("api/", include("groupselling.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
