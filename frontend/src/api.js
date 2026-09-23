const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === "1";

export const LOCAL_KNOWLEDGE = [
  {
    question: "what is your name",
    answer: "My name is AI Voice 3D Avatar Assistant.",
    keywords: "name,introduce yourself,who are you,tell me your name",
  },
  {
    question: "what can you do",
    answer: "I can answer questions from the dataset, speak the answer, and animate the avatar with lip-sync.",
    keywords: "help,features,do,can you,abilities",
  },
  {
    question: "how are you",
    answer: "I am ready and working properly.",
    keywords: "how are you,hello,hi,hey",
  },
  {
    question: "what is your purpose",
    answer: "My purpose is to work as a voice chatbot with a 3D avatar and answer from your saved dataset.",
    keywords: "purpose,why,about,goal",
  },
  {
    question: "how do i use voice",
    answer: "Click the microphone button, speak your question, and I will answer with voice.",
    keywords: "voice,mic,microphone,speak,speech",
  },
  {
    question: "how do i change answers",
    answer: "Add or edit rows in the KnowledgeBaseEntry table. Each row needs a question, answer, and optional keywords.",
    keywords: "change answers,dataset,table,admin,edit answer",
  },
  {
    question: "what is artificial intelligence",
    answer: "Artificial intelligence is technology that lets computers perform tasks that normally need human thinking.",
    keywords: "ai,artificial intelligence,machine intelligence",
  },
  {
    question: "what is python",
    answer: "Python is a popular programming language used for web apps, automation, data science, and AI.",
    keywords: "python,programming language,coding",
  },
  {
    question: "what is django",
    answer: "Django is a Python web framework used to build secure backend applications quickly.",
    keywords: "django,backend,python framework,web framework",
  },
  {
    question: "what is react",
    answer: "React is a JavaScript library for building interactive user interfaces.",
    keywords: "react,frontend,javascript,user interface,ui",
  },
  {
    question: "what is database",
    answer: "A database stores data in an organized way so an application can save, search, and update information.",
    keywords: "database,db,data,table,postgresql",
  },
  {
    question: "what is lip sync",
    answer: "Lip sync means moving the avatar mouth in time with spoken audio.",
    keywords: "lip sync,lipsync,mouth movement,avatar mouth",
  },
];

function normalizeText(value) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function wordScore(message, candidate) {
  const messageWords = new Set(normalizeText(message).split(" ").filter(Boolean));
  const candidateWords = normalizeText(candidate).split(" ").filter(Boolean);
  if (!messageWords.size || !candidateWords.length) return 0;

  const matches = candidateWords.filter((word) => messageWords.has(word)).length;
  return matches / candidateWords.length;
}

function findLocalAnswer(message) {
  const text = normalizeText(message);
  let best = null;
  let bestScore = 0;

  for (const row of LOCAL_KNOWLEDGE) {
    const keywordScore = row.keywords
      .split(",")
      .map((keyword) => normalizeText(keyword))
      .some((keyword) => keyword && text.includes(keyword))
      ? 1
      : 0;
    const score = Math.max(wordScore(text, row.question), keywordScore);

    if (score > bestScore) {
      best = row;
      bestScore = score;
    }
  }

  return bestScore >= 0.5 ? best : null;
}

function makeLipSync(text) {
  const mouthMap = {
    a: "A",
    e: "E",
    i: "E",
    o: "O",
    u: "O",
    m: "M",
    b: "M",
    p: "M",
    f: "F",
    v: "F",
    l: "L",
    r: "L",
    s: "S",
    z: "S",
    t: "S",
    d: "S",
  };
  let cursor = 0;

  return text.toLowerCase().split("").map((char) => {
    const duration = char.trim() ? 0.09 : 0.12;
    const cue = {
      start: Number(cursor.toFixed(2)),
      end: Number((cursor + duration).toFixed(2)),
      value: mouthMap[char] || (char.trim() ? "X" : "REST"),
    };
    cursor += duration;
    return cue;
  });
}

async function request(path, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.detail || "API request failed");
  }

  return data;
}

export function sendChatMessage(message) {
  if (!USE_BACKEND) {
    const match = findLocalAnswer(message);
    return Promise.resolve({
      reply: match
        ? match.answer
        : "I do not have this answer in my dataset yet. Add this question and answer to the dataset.",
      avatar: {
        mood: "listening",
        animation: "talk",
      },
      source: match ? "local-dataset" : "local-fallback",
    });
  }

  return request("/chat/", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function requestSpeech(text) {
  if (!USE_BACKEND) {
    return Promise.resolve({
      text,
      audio_url: null,
      lip_sync: makeLipSync(text),
      provider: "browser-fallback",
    });
  }

  return request("/tts/", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function fetchKnowledge() {
  if (!USE_BACKEND) {
    return Promise.resolve({ results: LOCAL_KNOWLEDGE });
  }

  return request("/knowledge/", {
    method: "GET",
  });
}
