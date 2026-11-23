
from django.contrib import admin

from .models import Answer, Question, Report


@admin.action(description="Hide selected (moderation)")
def hide(modeladmin, request, queryset):
    queryset.update(is_hidden=True)


@admin.action(description="Show selected again")
def unhide(modeladmin, request, queryset):
    queryset.update(is_hidden=False)


@admin.action(description="Mark reports as resolved")
def resolve(modeladmin, request, queryset):
    queryset.update(resolved=True)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "crop", "is_hidden", "created_at")
    list_filter = ("is_hidden",)
    search_fields = ("title", "body")
    actions = [hide, unhide]


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ("question", "author", "is_accepted", "is_hidden", "created_at")
    list_filter = ("is_hidden", "is_accepted")
    actions = [hide, unhide]


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("reporter", "question", "answer", "reason", "resolved", "created_at")
    list_filter = ("resolved",)
    actions = [resolve]
