
from rest_framework.permissions import BasePermission


class IsFarmer(BasePermission):
    message = "Only farmer accounts can manage farms."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == "farmer")



class IsBuyer(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == "buyer")
