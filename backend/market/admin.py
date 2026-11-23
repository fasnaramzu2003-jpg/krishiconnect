from django.contrib import admin
from .models import MarketPrice
@admin.register(MarketPrice)
class MarketPriceAdmin(admin.ModelAdmin):
    list_display = ("crop", "market_name", "price", "unit", "price_date", "source_name", "is_demo")
    list_filter = ("crop", "district", "unit", "is_demo")
    search_fields = ("market_name", "source_name")
    date_hierarchy = "price_date"

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
