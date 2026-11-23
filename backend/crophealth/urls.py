
from rest_framework.routers import SimpleRouter

from .views import CropHealthViewSet

router = SimpleRouter()
router.register("crop-health", CropHealthViewSet, basename="crop-health")

urlpatterns = router.urls
