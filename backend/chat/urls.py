from django.urls import path

from . import views


urlpatterns = [
    path("health/", views.health_check, name="health-check"),
    path("knowledge/", views.knowledge_list, name="knowledge-list"),
    path("chat/", views.chat_message, name="chat-message"),
    path("tts/", views.text_to_speech, name="text-to-speech"),
]
