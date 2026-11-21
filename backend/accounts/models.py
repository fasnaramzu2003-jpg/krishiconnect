from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        FARMER = "farmer", "Farmer"
        BUYER = "buyer", "Buyer"
        EXPERT = "expert", "Expert"
        ADMIN = "admin", "Admin"

    class Language(models.TextChoices):
        ENGLISH = "en", "English"
        MALAYALAM = "ml", "Malayalam"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.FARMER)
    phone = models.CharField(max_length=15, blank=True)
    preferred_language = models.CharField(
        max_length=2, choices=Language.choices, default=Language.ENGLISH
    )
    is_verified = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=["role"])]

    def __str__(self):
        return self.username


class UserProfile(models.Model):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name="profile"
    )
    district = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, default="Kerala")
    bio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username}"
