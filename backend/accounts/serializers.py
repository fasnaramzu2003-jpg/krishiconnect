
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import CustomUser, UserProfile


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ("district", "state", "bio")


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(required=False)

    class Meta:
        model = CustomUser
        fields = (
            "id", "username", "email", "role", "phone",
            "preferred_language", "is_verified", "profile",
        )
        read_only_fields = ("id", "username", "email", "role", "is_verified")

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", {})
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        profile, _ = UserProfile.objects.get_or_create(user=instance)
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    role = serializers.ChoiceField(
        choices=[("farmer", "Farmer"), ("buyer", "Buyer"), ("expert", "Expert")]
    )

    class Meta:
        model = CustomUser
        fields = ("username", "email", "password", "role", "phone", "preferred_language")

    def validate_email(self, value):
        return value.lower()

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        UserProfile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
