
from rest_framework import serializers

from .models import Farm, Field


class FarmSerializer(serializers.ModelSerializer):
    fields_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Farm
        fields = (
            "id", "name", "district", "state", "latitude", "longitude",
            "area_acres", "description", "fields_count", "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_name(self, value):
        owner = self.context["request"].user
        queryset = Farm.objects.filter(owner=owner, name__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("You already have a farm with this name.")
        return value


class FieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = Field
        fields = ("id", "farm", "name", "area_acres", "soil_type", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_farm(self, farm):
        if farm.owner_id != self.context["request"].user.id:
            raise serializers.ValidationError("Invalid farm.")
        return farm

    def validate(self, attrs):
        farm = attrs.get("farm") or (self.instance.farm if self.instance else None)
        name = attrs.get("name") or (self.instance.name if self.instance else None)
        if farm and name:
            queryset = Field.objects.filter(farm=farm, name__iexact=name)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError(
                    {"name": "This farm already has a field with this name."}
                )
        return attrs
