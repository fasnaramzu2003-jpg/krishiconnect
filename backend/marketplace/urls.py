
from rest_framework.routers import SimpleRouter

from .order_views import OrderViewSet
from .views import ListingImageViewSet, ListingViewSet

router = SimpleRouter()
router.register("listings", ListingViewSet, basename="listing")
router.register("listing-images", ListingImageViewSet, basename="listing-image")
router.register("orders", OrderViewSet, basename="order")

urlpatterns = router.urls
