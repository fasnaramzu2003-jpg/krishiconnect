
from django.db import models


class KnowledgeDocument(models.Model):
    LANGUAGES = [("en", "English"), ("ml", "Malayalam")]

    title = models.CharField(max_length=200)
    source_name = models.CharField(max_length=200)
    source_url = models.URLField(blank=True)
    language = models.CharField(max_length=2, choices=LANGUAGES, default="en")
    crop = models.ForeignKey("crops.Crop", null=True, blank=True, on_delete=models.SET_NULL)
    content = models.TextField(help_text="Separate paragraphs with a blank line.")
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return self.title
