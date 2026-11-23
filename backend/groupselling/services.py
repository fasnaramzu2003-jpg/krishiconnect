
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import GroupSaleContribution, GroupSaleRequest


@transaction.atomic
def contribute(request_id, farmer, quantity, note=""):
    req = GroupSaleRequest.objects.select_for_update().get(pk=request_id)
    if req.status != GroupSaleRequest.Status.OPEN:
        raise ValidationError({"detail": "This request is not open for pledges."})
    if req.deadline < timezone.localdate():
        raise ValidationError({"detail": "The deadline has passed."})
    if req.buyer_id == farmer.id:
        raise ValidationError({"detail": "You cannot pledge to your own request."})
    if req.contributions.filter(farmer=farmer).exists():
        raise ValidationError({"detail": "You already pledged. Withdraw it first to change."})
    remaining = req.quantity_needed - req.filled_quantity()
    if quantity > remaining:
        raise ValidationError(
            {"quantity": [f"Only {remaining} {req.unit} is still needed."]}
        )
    GroupSaleContribution.objects.create(
        request=req, farmer=farmer, quantity=quantity, note=note
    )
    if quantity == remaining:
        req.status = GroupSaleRequest.Status.FILLED
        req.save(update_fields=["status"])
    return req


@transaction.atomic
def withdraw(request_id, farmer):
    req = GroupSaleRequest.objects.select_for_update().get(pk=request_id)
    pledge = req.contributions.filter(farmer=farmer).first()
    if pledge is None:
        raise ValidationError({"detail": "You have no pledge on this request."})
    if pledge.status != GroupSaleContribution.Status.PLEDGED:
        raise ValidationError({"detail": "A delivered pledge cannot be withdrawn."})
    if req.status not in (GroupSaleRequest.Status.OPEN, GroupSaleRequest.Status.FILLED):
        raise ValidationError({"detail": "This request is closed."})
    pledge.delete()
    if req.status == GroupSaleRequest.Status.FILLED:
        req.status = GroupSaleRequest.Status.OPEN
        req.save(update_fields=["status"])
    return req


@transaction.atomic
def cancel_request(request_id, user):
    req = GroupSaleRequest.objects.select_for_update().get(pk=request_id)
    if req.buyer_id != user.id:
        raise PermissionDenied("Only the buyer can cancel this request.")
    if req.status not in (GroupSaleRequest.Status.OPEN, GroupSaleRequest.Status.FILLED):
        raise ValidationError({"detail": "This request cannot be cancelled now."})
    req.status = GroupSaleRequest.Status.CANCELLED
    req.save(update_fields=["status"])
    return req
