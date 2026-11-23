
import logging

from .models import Notification

logger = logging.getLogger(__name__)


def notify(user, kind, title, message, link=""):
    if user is None:
        return
    try:
        Notification.objects.create(
            user=user, kind=kind, title=title[:120], message=message[:300], link=link
        )
    except Exception:
        logger.exception("Could not create a notification")
