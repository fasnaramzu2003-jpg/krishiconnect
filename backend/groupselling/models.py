
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Sum


class GroupSaleRequest(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        FILLED = "filled", "Filled"
        FULFILLED = "fulfilled", "Fulfilled"
        CANCELLED = "cancelled", "Cancelled"

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="group_requests"
    )
    crop = models.ForeignKey("crops.Crop", on_delete=models.PROTECT)
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    quantity_needed = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    unit = models.CharField(max_length=20, default="kg")
    offered_price_per_unit = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    district = models.CharField(max_length=80, blank=True)
    deadline = models.DateField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["deadline", "-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity_needed__gt=0), name="group_request_qty_positive"
            ),
            models.CheckConstraint(
                condition=models.Q(offered_price_per_unit__gt=0),
                name="group_request_price_positive",
            ),
        ]

    def filled_quantity(self):
        total = self.contributions.aggregate(total=Sum("quantity"))["total"]
        return total or Decimal("0")

    def __str__(self):
        return self.title


class GroupSaleContribution(models.Model):
    class Status(models.TextChoices):
        PLEDGED = "pledged", "Pledged"
        DELIVERED = "delivered", "Delivered"

    request = models.ForeignKey(
        GroupSaleRequest, on_delete=models.CASCADE, related_name="contributions"
    )
    farmer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="group_contributions"
    )
    quantity = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PLEDGED)
    note = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["request", "farmer"], name="one_contribution_per_farmer"
            ),
            models.CheckConstraint(
                condition=models.Q(quantity__gt=0), name="contribution_qty_positive"
            ),
        ]

    def __str__(self):
        return f"{self.farmer} -> {self.request}"
