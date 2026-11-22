
from django.contrib import admin

from .models import Crop, CropActivity, FarmCrop


class CropActivityInline(admin.TabularInline):
    model = CropActivity
    extra = 0


@admin.register(Crop)
class CropAdmin(admin.ModelAdmin):
    list_display = ("name", "name_ml", "category")
    list_filter = ("category",)
    search_fields = ("name", "name_ml")


@admin.register(FarmCrop)
class FarmCropAdmin(admin.ModelAdmin):
    list_display = ("crop", "farm", "planting_date", "status")
    list_filter = ("status", "crop")
    inlines = [CropActivityInline]
