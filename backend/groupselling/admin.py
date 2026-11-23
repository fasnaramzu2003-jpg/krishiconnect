
from django.contrib import admin

from .models import GroupSaleContribution, GroupSaleRequest


class ContributionInline(admin.TabularInline):
    model = GroupSaleContribution
    extra = 0


@admin.register(GroupSaleRequest)
class GroupSaleRequestAdmin(admin.ModelAdmin):
    list_display = ("title", "buyer", "crop", "quantity_needed", "deadline", "status")
    list_filter = ("status", "district")
    inlines = [ContributionInline]
