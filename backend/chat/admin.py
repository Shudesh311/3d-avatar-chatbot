from django.contrib import admin

from .models import ChatMessage, KnowledgeBaseEntry


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("role", "text", "created_at")
    list_filter = ("role", "created_at")
    search_fields = ("text",)


@admin.register(KnowledgeBaseEntry)
class KnowledgeBaseEntryAdmin(admin.ModelAdmin):
    list_display = ("question", "active")
    list_filter = ("active",)
    search_fields = ("question", "answer", "keywords")
