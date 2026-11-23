
from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import NotFound, ValidationError

from .models import Order, OrderItem, ProductListing

SELLER_TRANSITIONS = {
    Order.Status.PENDING: {Order.Status.CONFIRMED, Order.Status.CANCELLED},
    Order.Status.CONFIRMED: {Order.Status.DELIVERED, Order.Status.CANCELLED},
}
BUYER_TRANSITIONS = {
    Order.Status.PENDING: {Order.Status.CANCELLED},
}


def place_order(buyer, items, delivery_address, contact_phone="", notes=""):
    ids = [item["listing"] for item in items]
    if len(ids) != len(set(ids)):
        raise ValidationError({"items": "Each product can appear only once."})

    with transaction.atomic():
        listings = {
            listing.id: listing
            for listing in ProductListing.objects.select_for_update()
            .filter(id__in=ids)
            .order_by("id")
        }
        seller_id = None
        lines = []
        for item in items:
            listing = listings.get(item["listing"])
            quantity = item["quantity"]
            if listing is None or listing.status != ProductListing.Status.ACTIVE:
                raise ValidationError(
                    {"items": f"Product {item['listing']} is not available."}
                )
            if listing.seller_id == buyer.id:
                raise ValidationError({"items": "You cannot order your own listing."})
            if seller_id is None:
                seller_id = listing.seller_id
            elif seller_id != listing.seller_id:
                raise ValidationError(
                    {"items": "All products in one order must be from the same seller."}
                )
            if quantity < listing.min_order_quantity:
                raise ValidationError({
                    "items": f"Minimum order for {listing.title} is "
                    f"{listing.min_order_quantity} {listing.unit}."
                })
            if quantity > listing.quantity_available:
                raise ValidationError({
                    "items": f"Only {listing.quantity_available} {listing.unit} "
                    f"of {listing.title} left."
                })
            lines.append((listing, quantity))

        order = Order.objects.create(
            buyer=buyer,
            seller_id=seller_id,
            delivery_address=delivery_address,
            contact_phone=contact_phone,
            notes=notes,
        )
        total = Decimal("0")
        for listing, quantity in lines:
            line_total = (listing.price_per_unit * quantity).quantize(Decimal("0.01"))
            OrderItem.objects.create(
                order=order,
                listing=listing,
                listing_title=listing.title,
                unit=listing.unit,
                unit_price=listing.price_per_unit,
                quantity=quantity,
                line_total=line_total,
            )
            listing.quantity_available -= quantity
            listing.save()
            total += line_total
        order.total_amount = total
        order.save(update_fields=["total_amount", "updated_at"])
    return order


def change_order_status(order_id, user, new_status):
    with transaction.atomic():
        order = Order.objects.select_for_update().filter(pk=order_id).first()
        if order is None or user.id not in (order.buyer_id, order.seller_id):
            raise NotFound("Order not found.")

        is_seller = order.seller_id == user.id
        rules = SELLER_TRANSITIONS if is_seller else BUYER_TRANSITIONS
        if new_status not in rules.get(order.status, set()):
            raise ValidationError({
                "status": f"You cannot change this order from {order.status} to {new_status}."
            })

        if new_status == Order.Status.CANCELLED:
            items = list(order.items.all())
            listing_ids = [item.listing_id for item in items if item.listing_id]
            listings = {
                listing.id: listing
                for listing in ProductListing.objects.select_for_update()
                .filter(id__in=listing_ids)
                .order_by("id")
            }
            for item in items:
                listing = listings.get(item.listing_id)
                if listing:
                    listing.quantity_available += item.quantity
                    listing.save()

        order.status = new_status
        order.save(update_fields=["status", "updated_at"])
    return order
