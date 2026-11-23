
from PIL import Image
from rest_framework import serializers

from .models import ListingImage, ProductListing

MAX_IMAGE_BYTES = 2 * 1024 * 1024
MAX_IMAGES_PER_LISTING = 5
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ("id", "listing", "image", "alt_text", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_listing(self, listing):
        if listing.seller_id != self.context["request"].user.id:
            raise serializers.ValidationError("Invalid listing.")
        if listing.images.count() >= MAX_IMAGES_PER_LISTING:
            raise serializers.ValidationError(
                f"A listing can have at most {MAX_IMAGES_PER_LISTING} images."
            )
        return listing

    def validate_image(self, image):
        if image.size > MAX_IMAGE_BYTES:
            raise serializers.ValidationError("Image must be 2 MB or smaller.")
        try:
            picture = Image.open(image)
            image_format = picture.format
        except Exception:
            raise serializers.ValidationError("Upload a valid image file.")
        finally:
            image.seek(0)
        if image_format not in ALLOWED_FORMATS:
            raise serializers.ValidationError("Only JPEG, PNG or WebP images are allowed.")
        return image


class ProductListingSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source="seller.username", read_only=True)
    seller_verified = serializers.BooleanField(source="seller.is_verified", read_only=True)
    crop_name = serializers.CharField(source="crop.name", read_only=True)
    images = ListingImageSerializer(many=True, read_only=True)
    status = serializers.ChoiceField(
        choices=[("active", "Active"), ("paused", "Paused")], default="active"
    )

    class Meta:
        model = ProductListing
        fields = (
            "id", "seller_name", "seller_verified", "farm", "crop", "crop_name",
            "title", "description", "price_per_unit", "unit", "quantity_available",
            "min_order_quantity", "district", "status", "images", "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_farm(self, farm):
        if farm and farm.owner_id != self.context["request"].user.id:
            raise serializers.ValidationError("Invalid farm.")
        return farm

    def validate(self, attrs):
        instance = self.instance
        quantity = attrs.get("quantity_available", getattr(instance, "quantity_available", None))
        minimum = attrs.get("min_order_quantity", getattr(instance, "min_order_quantity", None))
        if quantity and minimum and quantity > 0 and minimum > quantity:
            raise serializers.ValidationError(
                {"min_order_quantity": "Cannot be more than the quantity available."}
            )
        return attrs
