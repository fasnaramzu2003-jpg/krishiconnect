
import io
import os
import uuid

import cloudinary
import cloudinary.uploader
import cloudinary.utils
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible


@deconstructible
class CloudinaryStorage(Storage):
    """Saves uploaded images on Cloudinary (reads CLOUDINARY_URL from the environment)."""

    def _save(self, name, content):
        content.seek(0)
        data = io.BytesIO(content.read())
        base = os.path.splitext(name)[0]
        public_id = f"{base}_{uuid.uuid4().hex[:8]}"
        result = cloudinary.uploader.upload(
            data, public_id=public_id, resource_type="image"
        )
        return f"{result['public_id']}.{result['format']}"

    def exists(self, name):
        return False

    def url(self, name):
        return cloudinary.utils.cloudinary_url(name, secure=True)[0]

    def delete(self, name):
        cloudinary.uploader.destroy(os.path.splitext(name)[0], resource_type="image")

    def _open(self, name, mode="rb"):
        raise NotImplementedError("Files are stored on Cloudinary.")
