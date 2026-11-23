
from django.conf import settings
from django.db import models


class CropHealthReport(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="health_reports"
    )
    crop_name = models.CharField(max_length=100)
    symptoms_note = models.CharField(max_length=500, blank=True)
    language = models.CharField(max_length=2, default="en")
    image = models.ImageField(upload_to="crop_health/%Y/%m/")
    analysis = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.crop_name} ({self.owner})"
