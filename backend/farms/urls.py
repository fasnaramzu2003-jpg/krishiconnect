
from rest_framework.routers import SimpleRouter

from .views import FarmViewSet, FieldViewSet

router = SimpleRouter()
router.register("farms/fields", FieldViewSet, basename="field")
router.register("farms", FarmViewSet, basename="farm")

urlpatterns = router.urls
