
from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import F, Q

from farms.models import Farm, Field


class Crop(models.Model):
    class Category(models.TextChoices):
        CEREAL = "cereal", "Cereal"
        VEGETABLE = "vegetable", "Vegetable"
        FRUIT = "fruit", "Fruit"
        SPICE = "spice", "Spice"
        PLANTATION = "plantation", "Plantation"
        TUBER = "tuber", "Tuber"
        PULSE = "pulse", "Pulse"
        OTHER = "other", "Other"

    name = models.CharField(max_length=100, unique=True)
    name_ml = models.CharField(max_length=100, blank=True)
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.OTHER
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class FarmCrop(models.Model):
    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        GROWING = "growing", "Growing"
        HARVESTED = "harvested", "Harvested"

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name="farm_crops")
    field = models.ForeignKey(
        Field, on_delete=models.SET_NULL, null=True, blank=True, related_name="farm_crops"
    )
    crop = models.ForeignKey(Crop, on_delete=models.PROTECT, related_name="farm_crops")
    variety = models.CharField(max_length=100, blank=True)
    planting_date = models.DateField()
    expected_harvest_date = models.DateField(null=True, blank=True)
    area_acres = models.DecimalField(
        max_digits=8, decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PLANNED
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-planting_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["farm", "field", "crop", "planting_date"],
                name="unique_farm_crop_planting",
            ),
            models.CheckConstraint(
                condition=Q(expected_harvest_date__isnull=True)
                | Q(expected_harvest_date__gte=F("planting_date")),
                name="harvest_after_planting",
            ),
        ]
        indexes = [models.Index(fields=["farm", "status"])]

    def __str__(self):
        return f"{self.crop.name} on {self.farm.name}"


class CropActivity(models.Model):
    class ActivityType(models.TextChoices):
        SOWING = "sowing", "Sowing or planting"
        IRRIGATION = "irrigation", "Irrigation"
        FERTILIZER = "fertilizer", "Fertilizer"
        PESTICIDE = "pesticide", "Pesticide"
        WEEDING = "weeding", "Weeding"
        HARVEST = "harvest", "Harvest"
        OTHER = "other", "Other"

    farm_crop = models.ForeignKey(
        FarmCrop, on_delete=models.CASCADE, related_name="activities"
    )
    activity_type = models.CharField(max_length=20, choices=ActivityType.choices)
    date = models.DateField()
    quantity = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal("0"))],
    )
    unit = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-id"]
        indexes = [models.Index(fields=["farm_crop", "date"])]

    def __str__(self):
        return f"{self.get_activity_type_display()} on {self.date}"
