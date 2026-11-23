
import base64
import io
import os

from PIL import Image, ImageOps
from rest_framework.exceptions import ValidationError

from assistant.groq_client import AssistantError, chat

PROMPT = (
    "You are a careful plant-health assistant for farmers in Kerala, India. Look at "
    "this photo of a {crop} plant. Reply with three short parts: 1) What you can "
    "actually see (visible signs only). 2) Possible causes: list 2 or 3, and say "
    "clearly that a photo alone cannot confirm the cause. 3) Safe things the farmer "
    "can check or do today, for example removing badly affected leaves, checking "
    "drainage, or keeping the plant apart. Do NOT name pesticides or give doses. "
    "Tell the farmer to show the plant to the local Krishi Bhavan or KAU/KVK expert "
    "before spraying. If the photo does not clearly show a plant or is too blurry, "
    "say so and ask for a clearer photo. Keep it under 180 words."
)


def prepare_image(upload):
    try:
        img = Image.open(upload)
        img = ImageOps.exif_transpose(img).convert("RGB")
    except (OSError, ValueError) as err:
        raise ValidationError({"image": ["This file is not a readable photo."]}) from err
    img.thumbnail((1024, 1024))
    buffer = io.BytesIO()
    img.save(buffer, "JPEG", quality=85)
    return buffer.getvalue()


def analyze(jpeg_bytes, crop_name, note, language):
    model = os.getenv("GROQ_VISION_MODEL", "").strip()
    if not model:
        raise AssistantError("The photo analysis model is not set (GROQ_VISION_MODEL).")
    text = PROMPT.format(crop=crop_name)
    text += " Reply in Malayalam script." if language == "ml" else " Reply in simple English."
    if note:
        text += f" The farmer's note: {note}"
    encoded = base64.b64encode(jpeg_bytes).decode("ascii")
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": text},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded}"}},
            ],
        }
    ]
    return chat(messages, model=model)
