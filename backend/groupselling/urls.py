
from rest_framework.routers import SimpleRouter

from .views import GroupSaleRequestViewSet

router = SimpleRouter()
router.register("group-requests", GroupSaleRequestViewSet, basename="group-request")

urlpatterns = router.urls
