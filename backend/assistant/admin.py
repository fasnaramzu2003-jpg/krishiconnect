
from django.contrib import admin

from .models import KnowledgeDocument


@admin.register(KnowledgeDocument)
class KnowledgeDocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "source_name", "language", "crop", "is_published")
    list_filter = ("language", "is_published")
    search_fields = ("title", "content", "source_name")
