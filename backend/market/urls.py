
from rest_framework.routers import SimpleRouter

from .views import PriceViewSet

router = SimpleRouter()
router.register("prices", PriceViewSet, basename="market-price")

urlpatterns = router.urls
