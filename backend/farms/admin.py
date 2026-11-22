
from django.contrib import admin

from .models import Farm, Field


class FieldInline(admin.TabularInline):
    model = Field
    extra = 0


@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "district", "area_acres")
    list_filter = ("district", "state")
    search_fields = ("name", "owner__username")
    inlines = [FieldInline]
