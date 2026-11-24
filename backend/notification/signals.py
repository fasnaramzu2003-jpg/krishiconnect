
import functools
import logging

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from community.models import Answer
from groupselling.models import GroupSaleContribution, GroupSaleRequest
from marketplace.models import Order

from .services import notify

logger = logging.getLogger(__name__)


def safe(func):
    """A notification problem must never break the real action."""

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception:
            logger.exception("Notification signal failed")

    return wrapper


def remember(sender, instance, field):
    old = None
    if instance.pk:
        old = sender.objects.filter(pk=instance.pk).values_list(field, flat=True).first()
    setattr(instance, f"_old_{field}", old)


@receiver(pre_save, sender=Order)
@safe
def order_before(sender, instance, **kwargs):
    remember(sender, instance, "status")


@receiver(post_save, sender=Order)
@safe
def order_after(sender, instance, created, **kwargs):
    if created:
        notify(instance.seller, "order", "New order",
               f"Order #{instance.pk} from {instance.buyer}.", "/orders")
    elif getattr(instance, "_old_status", None) != instance.status:
        text = f"Order #{instance.pk} is now {instance.status}."
        notify(instance.buyer, "order", "Order update", text, "/orders")
        if instance.status == "cancelled":
            notify(instance.seller, "order", "Order cancelled", text, "/orders")


@receiver(post_save, sender=GroupSaleContribution)
@safe
def pledge_after(sender, instance, created, **kwargs):
    if created:
        req = instance.request
        notify(req.buyer, "group", "New pledge",
               f'{instance.farmer} pledged {instance.quantity} {req.unit} to "{req.title}".',
               "/group-sales")


@receiver(pre_save, sender=GroupSaleRequest)
@safe
def request_before(sender, instance, **kwargs):
    remember(sender, instance, "status")


@receiver(post_save, sender=GroupSaleRequest)
@safe
def request_after(sender, instance, created, **kwargs):
    old = getattr(instance, "_old_status", None)
    if created or old == instance.status:
        return
    if instance.status == "filled":
        notify(instance.buyer, "group", "Request fully pledged",
               f'"{instance.title}" is now fully pledged.', "/group-sales")
        for pledge in instance.contributions.select_related("farmer"):
            notify(pledge.farmer, "group", "Request filled",
                   f'"{instance.title}" is now fully pledged.', "/group-sales")
    elif instance.status == "cancelled":
        for pledge in instance.contributions.select_related("farmer"):
            notify(pledge.farmer, "group", "Request cancelled",
                   f'The buyer cancelled "{instance.title}".', "/group-sales")


@receiver(pre_save, sender=Answer)
@safe
def answer_before(sender, instance, **kwargs):
    remember(sender, instance, "is_accepted")


@receiver(post_save, sender=Answer)
@safe
def answer_after(sender, instance, created, **kwargs):
    question = instance.question
    link = f"/community/{question.pk}"
    if created:
        if question.author_id != instance.author_id:
            notify(question.author, "answer", "New answer",
                   f'{instance.author} answered "{question.title}".', link)
    elif instance.is_accepted and not getattr(instance, "_old_is_accepted", False):
        notify(instance.author, "answer", "Answer accepted",
               f'Your answer to "{question.title}" was accepted.', link)
