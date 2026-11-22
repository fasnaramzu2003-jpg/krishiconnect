
from rest_framework.routers import SimpleRouter

from .views import CropActivityViewSet, CropViewSet, FarmCropViewSet

router = SimpleRouter()
router.register("crops", CropViewSet, basename="crop")
router.register("farm-crops", FarmCropViewSet, basename="farm-crop")
router.register("crop-activities", CropActivityViewSet, basename="crop-activity")

urlpatterns = router.urls
