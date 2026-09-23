from django.core.management.base import BaseCommand

from chat.models import KnowledgeBaseEntry


DATASET = [
    {
        "question": "what is your name",
        "answer": "My name is AI Voice 3D Avatar Assistant.",
        "keywords": "name,introduce yourself,who are you,tell me your name",
    },
    {
        "question": "what can you do",
        "answer": "I can answer questions from the dataset, speak the answer, and animate the avatar with lip-sync.",
        "keywords": "help,features,do,can you,abilities",
    },
    {
        "question": "how are you",
        "answer": "I am ready and working properly.",
        "keywords": "how are you,hello,hi,hey",
    },
    {
        "question": "what is your purpose",
        "answer": "My purpose is to work as a voice chatbot with a 3D avatar and answer from your saved dataset.",
        "keywords": "purpose,why,about,goal",
    },
    {
        "question": "how do i use voice",
        "answer": "Click the microphone button, speak your question, and I will answer with voice.",
        "keywords": "voice,mic,microphone,speak,speech",
    },
    {
        "question": "how do i change answers",
        "answer": "Add or edit rows in the KnowledgeBaseEntry table. Each row needs a question, answer, and optional keywords.",
        "keywords": "change answers,dataset,table,admin,edit answer",
    },
    {
        "question": "what is artificial intelligence",
        "answer": "Artificial intelligence is technology that lets computers perform tasks that normally need human thinking.",
        "keywords": "ai,artificial intelligence,machine intelligence",
    },
    {
        "question": "what is python",
        "answer": "Python is a popular programming language used for web apps, automation, data science, and AI.",
        "keywords": "python,programming language,coding",
    },
    {
        "question": "what is django",
        "answer": "Django is a Python web framework used to build secure backend applications quickly.",
        "keywords": "django,backend,python framework,web framework",
    },
    {
        "question": "what is react",
        "answer": "React is a JavaScript library for building interactive user interfaces.",
        "keywords": "react,frontend,javascript,user interface,ui",
    },
    {
        "question": "what is database",
        "answer": "A database stores data in an organized way so an application can save, search, and update information.",
        "keywords": "database,db,data,table,postgresql",
    },
    {
        "question": "what is lip sync",
        "answer": "Lip sync means moving the avatar mouth in time with spoken audio.",
        "keywords": "lip sync,lipsync,mouth movement,avatar mouth",
    },
]


class Command(BaseCommand):
    help = "Insert or update chatbot dataset rows."

    def handle(self, *args, **options):
        created = 0
        updated = 0

        for row in DATASET:
            _, was_created = KnowledgeBaseEntry.objects.update_or_create(
                question=row["question"],
                defaults={
                    "answer": row["answer"],
                    "keywords": row["keywords"],
                    "active": True,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(f"Seed complete: {created} created, {updated} updated.")
        )
