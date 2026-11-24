
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APITestCase

from crops.models import Crop

from .models import GroupSaleRequest

User = get_user_model()
PASSWORD = "Pass12345!x"


class GroupSellingRules(APITestCase):
    def setUp(self):
        cache.clear()
        call_command("seed_crops", verbosity=0)
        self.crop = Crop.objects.first()
        self.buyer = User.objects.create_user("buyer1", "b1@example.com", PASSWORD, role="buyer")
        self.f1 = User.objects.create_user("farm1", "f1@example.com", PASSWORD, role="farmer")
        self.f2 = User.objects.create_user("farm2", "f2@example.com", PASSWORD, role="farmer")
        self.client.force_authenticate(self.buyer)
        response = self.client.post(
            "/api/group-requests/",
            {
                "crop": self.crop.id,
                "title": "Need bananas",
                "quantity_needed": "100",
                "unit": "kg",
                "offered_price_per_unit": "40",
                "deadline": str(timezone.localdate() + timedelta(days=10)),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.pk = response.data["id"]
        self.url = f"/api/group-requests/{self.pk}/"

    def pledge(self, user, quantity):
        self.client.force_authenticate(user)
        return self.client.post(self.url + "contribute/", {"quantity": quantity}, format="json")

    def status(self):
        return GroupSaleRequest.objects.get(pk=self.pk).status

    def test_cannot_overfill(self):
        self.assertEqual(self.pledge(self.f1, "60").status_code, 201)
        response = self.pledge(self.f2, "50")
        self.assertEqual(response.status_code, 400)
        self.assertIn("quantity", response.data)

    def test_fills_then_reopens_on_withdraw(self):
        self.pledge(self.f1, "60")
        self.pledge(self.f2, "40")
        self.assertEqual(self.status(), "filled")
        self.client.force_authenticate(self.f2)
        self.client.post(self.url + "withdraw/")
        self.assertEqual(self.status(), "open")

    def test_one_pledge_per_farmer(self):
        self.assertEqual(self.pledge(self.f1, "10").status_code, 201)
        self.assertEqual(self.pledge(self.f1, "10").status_code, 400)

    def test_buyer_cannot_pledge(self):
        self.assertEqual(self.pledge(self.buyer, "10").status_code, 403)

    def test_farmer_cannot_post_request(self):
        self.client.force_authenticate(self.f1)
        response = self.client.post("/api/group-requests/", {}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_only_owner_can_cancel(self):
        self.client.force_authenticate(self.f1)
        self.assertEqual(self.client.post(self.url + "cancel/").status_code, 403)
        self.client.force_authenticate(self.buyer)
        self.assertEqual(self.client.post(self.url + "cancel/").status_code, 200)
        self.assertEqual(self.status(), "cancelled")
