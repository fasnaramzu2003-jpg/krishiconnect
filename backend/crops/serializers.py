
from rest_framework import serializers

from .models import Crop, CropActivity, FarmCrop


class CropSerializer(serializers.ModelSerializer):
    class Meta:
        model = Crop
        fields = ("id", "name", "name_ml", "category")


class FarmCropSerializer(serializers.ModelSerializer):
    crop_name = serializers.CharField(source="crop.name", read_only=True)
    farm_name = serializers.CharField(source="farm.name", read_only=True)

    class Meta:
        model = FarmCrop
        fields = (
            "id", "farm", "farm_name", "field", "crop", "crop_name", "variety",
            "planting_date", "expected_harvest_date", "area_acres", "status",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate(self, attrs):
        user = self.context["request"].user
        instance = self.instance
        farm = attrs.get("farm", getattr(instance, "farm", None))
        field = attrs.get("field", getattr(instance, "field", None))
        crop = attrs.get("crop", getattr(instance, "crop", None))
        planting = attrs.get("planting_date", getattr(instance, "planting_date", None))
        harvest = attrs.get(
            "expected_harvest_date", getattr(instance, "expected_harvest_date", None)
        )

        errors = {}
        if farm and farm.owner_id != user.id:
            errors["farm"] = "Invalid farm."
        if field and farm and field.farm_id != farm.id:
            errors["field"] = "This field does not belong to the selected farm."
        if planting and harvest and harvest < planting:
            errors["expected_harvest_date"] = (
                "Harvest date cannot be before the planting date."
            )
        if errors:
            raise serializers.ValidationError(errors)

        if farm and crop and planting:
            duplicates = FarmCrop.objects.filter(
                farm=farm, field=field, crop=crop, planting_date=planting
            )
            if instance:
                duplicates = duplicates.exclude(pk=instance.pk)
            if duplicates.exists():
                raise serializers.ValidationError(
                    "This crop is already recorded for that farm, field and planting date."
                )
        return attrs


class CropActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = CropActivity
        fields = (
            "id", "farm_crop", "activity_type", "date", "quantity", "unit",
            "notes", "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_farm_crop(self, farm_crop):
        if farm_crop.farm.owner_id != self.context["request"].user.id:
            raise serializers.ValidationError("Invalid crop record.")
        return farm_crop

    def validate(self, attrs):
        instance = self.instance
        farm_crop = attrs.get("farm_crop", getattr(instance, "farm_crop", None))
        date = attrs.get("date", getattr(instance, "date", None))
        activity_type = attrs.get("activity_type", getattr(instance, "activity_type", None))
        quantity = attrs.get("quantity", getattr(instance, "quantity", None))

        errors = {}
        if farm_crop and date and date < farm_crop.planting_date:
            errors["date"] = "Activity date cannot be before the planting date."
        if activity_type == CropActivity.ActivityType.HARVEST and quantity is None:
            errors["quantity"] = "Enter the harvested quantity."
        if errors:
            raise serializers.ValidationError(errors)
        return attrs
