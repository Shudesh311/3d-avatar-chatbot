import json
import urllib.error

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from openai import OpenAIError

from .services import active_knowledge_rows, create_chat_reply, text_to_speech_payload


def _json_body(request):
    if not request.body:
        return {}
    return json.loads(request.body.decode("utf-8"))


@require_http_methods(["GET"])
def health_check(request):
    return JsonResponse({"status": "ok", "service": "ai-voice-3d-avatar"})


@require_http_methods(["GET"])
def knowledge_list(request):
    return JsonResponse({"results": active_knowledge_rows()})


@csrf_exempt
@require_http_methods(["POST"])
def chat_message(request):
    data = _json_body(request)
    message = (data.get("message") or "").strip()

    if not message:
        return JsonResponse({"error": "message is required"}, status=400)

    try:
        payload = create_chat_reply(message)
    except OpenAIError as error:
        return JsonResponse({"error": f"OpenAI chat failed: {error}"}, status=502)

    return JsonResponse(payload)


@csrf_exempt
@require_http_methods(["POST"])
def text_to_speech(request):
    data = _json_body(request)
    text = (data.get("text") or "").strip()

    if not text:
        return JsonResponse({"error": "text is required"}, status=400)

    try:
        payload = text_to_speech_payload(text)
    except urllib.error.URLError as error:
        return JsonResponse({"error": f"Text-to-speech failed: {error}"}, status=502)

    return JsonResponse(payload)
