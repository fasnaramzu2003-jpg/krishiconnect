
from django.contrib import admin

from .models import ListingImage, Order, OrderItem, ProductListing


class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 0


@admin.action(description="Remove selected listings (moderation)")
def remove_listings(modeladmin, request, queryset):
    queryset.update(status=ProductListing.Status.REMOVED)


@admin.register(ProductListing)
class ProductListingAdmin(admin.ModelAdmin):
    list_display = ("title", "seller", "crop", "price_per_unit", "quantity_available", "status")
    list_filter = ("status", "crop", "district")
    search_fields = ("title", "seller__username")
    inlines = [ListingImageInline]
    actions = [remove_listings]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("listing", "listing_title", "unit", "unit_price", "quantity", "line_total")
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "buyer", "seller", "status", "total_amount", "created_at")
    list_filter = ("status",)
    search_fields = ("buyer__username", "seller__username")
    inlines = [OrderItemInline]
