
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class MarketPrice(models.Model):
    UNITS = [("kg", "per kg"), ("quintal", "per quintal")]

    crop = models.ForeignKey("crops.Crop", on_delete=models.PROTECT)
    market_name = models.CharField(max_length=120)
    district = models.CharField(max_length=80, blank=True)
    unit = models.CharField(max_length=10, choices=UNITS, default="kg")
    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)]
    )
    price_date = models.DateField()
    source_name = models.CharField(max_length=200)
    source_url = models.URLField(blank=True)
    is_demo = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-price_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["crop", "market_name", "price_date", "unit"],
                name="one_price_per_market_day",
            ),
            models.CheckConstraint(condition=models.Q(price__gt=0), name="price_positive"),
        ]

    def __str__(self):
        return f"{self.crop} {self.price} ({self.price_date})"
