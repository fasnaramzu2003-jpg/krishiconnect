from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser, UserProfile


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("KrishiConnect", {"fields": ("role", "phone", "preferred_language", "is_verified")}),
    )
    list_display = ("username", "email", "role", "is_verified", "is_staff")
    list_filter = ("role", "is_verified", "is_staff")


admin.site.register(UserProfile)
