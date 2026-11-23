
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q

from crops.models import Crop
from farms.models import Farm


class ProductListing(models.Model):
    class Unit(models.TextChoices):
        KG = "kg", "Kilogram"
        DOZEN = "dozen", "Dozen"
        PIECE = "piece", "Piece"
        BUNCH = "bunch", "Bunch"
        LITRE = "litre", "Litre"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        SOLD_OUT = "sold_out", "Sold out"
        REMOVED = "removed", "Removed by moderator"

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="listings"
    )
    farm = models.ForeignKey(
        Farm, on_delete=models.SET_NULL, null=True, blank=True, related_name="listings"
    )
    crop = models.ForeignKey(Crop, on_delete=models.PROTECT, related_name="listings")
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    price_per_unit = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    unit = models.CharField(max_length=10, choices=Unit.choices, default=Unit.KG)
    quantity_available = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
    )
    min_order_quantity = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("1"),
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    district = models.CharField(max_length=100, blank=True)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=Q(price_per_unit__gt=0), name="listing_price_positive"
            ),
            models.CheckConstraint(
                condition=Q(quantity_available__gte=0), name="listing_stock_not_negative"
            ),
        ]
        indexes = [
            models.Index(fields=["status", "crop"]),
            models.Index(fields=["district"]),
        ]

    def save(self, *args, **kwargs):
        if self.quantity_available <= 0 and self.status == self.Status.ACTIVE:
            self.status = self.Status.SOLD_OUT
        elif self.quantity_available > 0 and self.status == self.Status.SOLD_OUT:
            self.status = self.Status.ACTIVE
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class ListingImage(models.Model):
    listing = models.ForeignKey(
        ProductListing, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="listings/%Y/%m/")
    alt_text = models.CharField(max_length=150, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"Image for {self.listing.title}"


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders_placed"
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders_received"
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    delivery_address = models.TextField()
    contact_phone = models.CharField(max_length=15, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=Q(total_amount__gte=0), name="order_total_not_negative"
            ),
        ]
        indexes = [
            models.Index(fields=["buyer", "status"]),
            models.Index(fields=["seller", "status"]),
        ]

    def __str__(self):
        return f"Order {self.pk} ({self.status})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    listing = models.ForeignKey(
        ProductListing, on_delete=models.SET_NULL, null=True, related_name="order_items"
    )
    listing_title = models.CharField(max_length=150)
    unit = models.CharField(max_length=10)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(quantity__gt=0), name="order_item_quantity_positive"
            ),
            models.CheckConstraint(
                condition=Q(unit_price__gt=0), name="order_item_price_positive"
            ),
        ]

    def __str__(self):
        return f"{self.quantity} x {self.listing_title}"
