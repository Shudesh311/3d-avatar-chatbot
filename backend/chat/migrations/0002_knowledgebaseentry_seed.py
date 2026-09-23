from django.db import migrations, models


def seed_knowledge(apps, schema_editor):
    KnowledgeBaseEntry = apps.get_model("chat", "KnowledgeBaseEntry")
    entries = [
        {
            "question": "what is your name",
            "answer": "My name is AI Voice 3D Avatar Assistant.",
            "keywords": "name,introduce yourself,who are you",
        },
        {
            "question": "what can you do",
            "answer": "I can answer questions from the table, speak the answer, and animate the avatar with lip-sync.",
            "keywords": "help,features,do,can you",
        },
        {
            "question": "how are you",
            "answer": "I am ready and working.",
            "keywords": "how are you,hello,hi",
        },
        {
            "question": "what is your purpose",
            "answer": "My purpose is to chat by text or voice and speak the answer through text-to-speech.",
            "keywords": "purpose,why,about",
        },
        {
            "question": "how do i use voice",
            "answer": "Click the microphone button, speak your question, and I will answer it with voice.",
            "keywords": "voice,mic,microphone,speak",
        },
        {
            "question": "how do i change answers",
            "answer": "Open the Django admin or update the knowledge table to change the answers.",
            "keywords": "change answers,dataset,table,admin",
        },
    ]

    for row in entries:
        KnowledgeBaseEntry.objects.update_or_create(
            question=row["question"],
            defaults={
                "answer": row["answer"],
                "keywords": row["keywords"],
                "active": True,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ("chat", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="KnowledgeBaseEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("question", models.CharField(max_length=255, unique=True)),
                ("answer", models.TextField()),
                ("keywords", models.CharField(blank=True, max_length=255)),
                ("active", models.BooleanField(default=True)),
            ],
            options={
                "ordering": ["question"],
            },
        ),
        migrations.RunPython(seed_knowledge, migrations.RunPython.noop),
    ]
