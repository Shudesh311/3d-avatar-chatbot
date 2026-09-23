import base64
from difflib import SequenceMatcher
import json
import re
import urllib.error
import urllib.request

from django.conf import settings
from openai import OpenAI

from .models import ChatMessage, KnowledgeBaseEntry


def make_lip_sync(text):
    cues = []
    cursor = 0.0
    mouth_map = {
        "a": "A",
        "e": "E",
        "i": "E",
        "o": "O",
        "u": "O",
        "m": "M",
        "b": "M",
        "p": "M",
        "f": "F",
        "v": "F",
        "l": "L",
        "r": "L",
        "s": "S",
        "z": "S",
        "t": "S",
        "d": "S",
    }

    for char in text.lower():
        duration = 0.09 if char.strip() else 0.12
        cues.append(
            {
                "start": round(cursor, 2),
                "end": round(cursor + duration, 2),
                "value": mouth_map.get(char, "X" if char.strip() else "REST"),
            }
        )
        cursor += duration

    return cues


def text_to_speech_payload(text):
    audio_url = elevenlabs_tts(text)
    return {
        "text": text,
        "audio_url": audio_url,
        "lip_sync": make_lip_sync(text),
        "provider": "elevenlabs" if audio_url else "browser-fallback",
    }


def elevenlabs_tts(text):
    if not settings.ELEVENLABS_API_KEY:
        return None

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.ELEVENLABS_VOICE_ID}"
    payload = json.dumps(
        {
            "text": text,
            "model_id": settings.ELEVENLABS_MODEL_ID,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
            },
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        method="POST",
        headers={
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": settings.ELEVENLABS_API_KEY,
        },
    )

    with urllib.request.urlopen(req, timeout=30) as response:
        audio = response.read()

    return "data:audio/mpeg;base64," + base64.b64encode(audio).decode("utf-8")


def create_chat_reply(message):
    ChatMessage.objects.create(role="user", text=message)
    matched_entry = find_dataset_answer(message)
    reply = matched_entry.answer if matched_entry else assistant_reply(message)
    ChatMessage.objects.create(role="assistant", text=reply)

    return {
        "reply": reply,
        "avatar": {
            "mood": "listening",
            "animation": "talk",
        },
        "source": "dataset" if matched_entry else "openai-fallback",
    }


def assistant_reply(message):
    entry = find_dataset_answer(message)
    if entry:
        return entry.answer

    if not settings.OPENAI_API_KEY:
        return (
            "I do not have a matching answer in the dataset yet. Add a row to "
            "the knowledge table or set OPENAI_API_KEY in backend/.env."
        )

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a concise AI voice avatar assistant. Reply naturally in "
                    "one or two short sentences so text-to-speech sounds clear."
                ),
            },
            {"role": "user", "content": message},
        ],
    )
    return response.choices[0].message.content.strip()


def active_knowledge_rows():
    return list(
        KnowledgeBaseEntry.objects.filter(active=True).values(
            "question",
            "answer",
            "keywords",
        )
    )


def normalize_text(value):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", value.lower())).strip()


def token_score(message_text, candidate_text):
    message_words = set(normalize_text(message_text).split())
    candidate_words = set(normalize_text(candidate_text).split())
    if not message_words or not candidate_words:
        return 0.0

    return len(message_words & candidate_words) / len(candidate_words)


def find_dataset_answer(message):
    text = normalize_text(message)
    if not text:
        return None

    entries = KnowledgeBaseEntry.objects.filter(active=True)
    best_entry = None
    best_score = 0.0

    for entry in entries:
        normalized_question = normalize_text(entry.question)
        question_score = max(
            SequenceMatcher(None, text, normalized_question).ratio(),
            token_score(text, normalized_question),
        )
        keyword_score = 0.0
        keywords = [
            normalize_text(keyword)
            for keyword in entry.keywords.split(",")
            if keyword.strip()
        ]
        matching_keywords = [
            keyword
            for keyword in keywords
            if keyword and (keyword in text or keyword in text.split())
        ]
        if matching_keywords:
            keyword_score = max(
                SequenceMatcher(None, text, keyword).ratio() if " " in keyword else 1.0
                for keyword in matching_keywords
            )

        score = max(question_score, keyword_score)
        if score > best_score:
            best_score = score
            best_entry = entry

    if best_score >= 0.5:
        return best_entry
    return None
