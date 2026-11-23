
import csv
from datetime import date
from decimal import Decimal, InvalidOperation

from django.core.management.base import BaseCommand, CommandError

from crops.models import Crop
from market.models import MarketPrice


class Command(BaseCommand):
    help = "Import market prices from a CSV file."

    def add_arguments(self, parser):
        parser.add_argument("path")
        parser.add_argument("--demo", action="store_true", help="mark rows as DEMO data")

    def handle(self, *args, **options):
        try:
            handle = open(options["path"], newline="", encoding="utf-8-sig")
        except OSError as err:
            raise CommandError(str(err))
        added = skipped = 0
        with handle:
            for number, row in enumerate(csv.DictReader(handle), start=2):
                try:
                    crop = Crop.objects.get(name__iexact=row["crop"].strip())
                    price = Decimal(row["price"].strip())
                    when = date.fromisoformat(row["date"].strip())
                    unit = row["unit"].strip().lower()
                    if unit not in ("kg", "quintal") or price <= 0:
                        raise ValueError("bad unit or price")
                    _, created = MarketPrice.objects.get_or_create(
                        crop=crop,
                        market_name=row["market"].strip(),
                        price_date=when,
                        unit=unit,
                        defaults={
                            "district": row.get("district", "").strip(),
                            "price": price,
                            "source_name": row["source_name"].strip(),
                            "source_url": row.get("source_url", "").strip(),
                            "is_demo": options["demo"],
                        },
                    )
                except (Crop.DoesNotExist, InvalidOperation, ValueError, KeyError) as err:
                    skipped += 1
                    self.stderr.write(f"Row {number} skipped: {err!r}")
                    continue
                added += 1 if created else 0
        self.stdout.write(f"Added {added}, skipped {skipped}.")
