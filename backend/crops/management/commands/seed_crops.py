
from django.core.management.base import BaseCommand

from crops.models import Crop

CROPS = [
    ("Paddy (rice)", "cereal"),
    ("Coconut", "plantation"),
    ("Banana", "fruit"),
    ("Black pepper", "spice"),
    ("Cardamom", "spice"),
    ("Rubber", "plantation"),
    ("Tapioca", "tuber"),
    ("Ginger", "spice"),
    ("Turmeric", "spice"),
    ("Arecanut", "plantation"),
    ("Cashew", "plantation"),
    ("Okra", "vegetable"),
    ("Brinjal", "vegetable"),
    ("Cowpea", "pulse"),
]


class Command(BaseCommand):
    help = "Add common Kerala crops to the crop list"

    def handle(self, *args, **options):
        created = 0
        for name, category in CROPS:
            _, was_created = Crop.objects.get_or_create(
                name=name, defaults={"category": category}
            )
            created += int(was_created)
        self.stdout.write(self.style.SUCCESS(f"{created} crops added."))
