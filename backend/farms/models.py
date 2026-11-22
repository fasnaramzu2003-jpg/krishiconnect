
from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Farm(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="farms"
    )
    name = models.CharField(max_length=120)
    district = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, default="Kerala")
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        validators=[MinValueValidator(Decimal("-90")), MaxValueValidator(Decimal("90"))],
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        validators=[MinValueValidator(Decimal("-180")), MaxValueValidator(Decimal("180"))],
    )
    area_acres = models.DecimalField(
        max_digits=8, decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "name"], name="unique_farm_name_per_owner"
            )
        ]
        indexes = [models.Index(fields=["owner", "district"])]

    def __str__(self):
        return f"{self.name} ({self.owner})"


class Field(models.Model):
    class SoilType(models.TextChoices):
        LATERITE = "laterite", "Laterite"
        ALLUVIAL = "alluvial", "Alluvial"
        CLAY = "clay", "Clay"
        SANDY = "sandy", "Sandy"
        LOAMY = "loamy", "Loamy"
        FOREST = "forest", "Forest"
        OTHER = "other", "Other"

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name="fields")
    name = models.CharField(max_length=120)
    area_acres = models.DecimalField(
        max_digits=8, decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    soil_type = models.CharField(
        max_length=20, choices=SoilType.choices, default=SoilType.OTHER
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["farm", "name"], name="unique_field_name_per_farm"
            )
        ]

    def __str__(self):
        return f"{self.name} - {self.farm.name}"
