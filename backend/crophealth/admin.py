
from django.contrib import admin

from .models import CropHealthReport


@admin.register(CropHealthReport)
class CropHealthReportAdmin(admin.ModelAdmin):
    list_display = ("crop_name", "owner", "created_at")
