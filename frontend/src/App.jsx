import { Mic, MicOff, Send, Volume2 } from "lucide-react";
import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LOCAL_KNOWLEDGE, requestSpeech, sendChatMessage } from "./api.js";
import AvatarScene from "./components/AvatarScene.jsx";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

function chooseMaleVoice() {
  if (!("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("en"));
  return (
    englishVoices.find((voice) => /male|david|mark|daniel|george|james|microsoft guy/i.test(voice.name)) ||
    englishVoices.find((voice) => !/female|zira|susan|samantha|victoria|karen/i.test(voice.name)) ||
    voices[0] ||
    null
  );
}

function speak(text, onStart, onDone) {
  if (!("speechSynthesis" in window)) {
    onDone?.();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.98;
  utterance.pitch = 0.86;
  utterance.voice = chooseMaleVoice();
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onDone?.();
  utterance.onerror = () => onDone?.();
  window.speechSynthesis.speak(utterance);
}

export default function App() {
  const audioRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello, I am ready for text or voice chat.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [lipSync, setLipSync] = useState([]);
  const [speechStartTime, setSpeechStartTime] = useState(0);
  const [error, setError] = useState("");
  const [starterQuestions, setStarterQuestions] = useState([]);

  const recognition = useMemo(() => {
    if (!SpeechRecognition) return null;

    const instance = new SpeechRecognition();
    instance.lang = "en-US";
    instance.interimResults = false;
    instance.continuous = false;
    instance.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    instance.onend = () => setListening(false);
    return instance;
  }, []);

  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }

    setStarterQuestions(LOCAL_KNOWLEDGE.slice(0, 6));

    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    setError("");
    setInput("");
    setLoading(true);
    setMessages((current) => [...current, { role: "user", text: message }]);

    try {
      const data = await sendChatMessage(message);
      setMessages((current) => [...current, { role: "assistant", text: data.reply }]);
      const speech = await requestSpeech(data.reply);
      setLipSync(speech.lip_sync || []);

      if (speech.audio_url) {
        audioRef.current?.pause();
        const audio = new Audio(speech.audio_url);
        audioRef.current = audio;
        audio.onplay = () => {
          setSpeechStartTime(performance.now());
          setSpeaking(true);
        };
        audio.onended = () => setSpeaking(false);
        audio.onerror = () => setSpeaking(false);
        await audio.play();
      } else {
        speak(
          data.reply,
          () => {
            setSpeechStartTime(performance.now());
            setSpeaking(true);
          },
          () => setSpeaking(false)
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleVoice() {
    if (!recognition) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }

    setError("");
    setListening(true);
    recognition.start();
  }

  function chooseQuestion(question) {
    setInput(question);
  }

  return (
    <main className="app-shell">
      <section className="avatar-panel" aria-label="3D avatar">
        <AvatarScene speaking={speaking || loading} lipSync={lipSync} speechStartTime={speechStartTime} />
      </section>

      <section className="chat-panel" aria-label="AI voice chatbot">
        <header>
          <p className="eyebrow">AI Voice Chatbot</p>
          <h1>3D Avatar Assistant</h1>
        </header>

        <div className="messages">
          {messages.map((message, index) => (
            <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
              {message.text}
            </div>
          ))}
          {loading && <div className="message assistant">Thinking...</div>}
        </div>

        {error && <div className="error">{error}</div>}

        <section className="starter-block" aria-label="starter questions">
          <div className="starter-title">Starter questions</div>
          <div className="starter-grid">
            {starterQuestions.map((item) => (
              <button
                key={item.question}
                type="button"
                className="starter-pill"
                onClick={() => chooseQuestion(item.question)}
              >
                {item.question}
              </button>
            ))}
          </div>
        </section>

        <form className="composer" onSubmit={handleSubmit}>
          <button
            type="button"
            className={`icon-button ${listening ? "active" : ""}`}
            onClick={toggleVoice}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            title={listening ? "Stop voice input" : "Start voice input"}
          >
            {listening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type or speak your message"
          />
          <button type="button" className="icon-button" onClick={() => speak(input)} title="Speak input">
            <Volume2 size={20} />
          </button>
          <button className="send-button" type="submit" disabled={loading || !input.trim()}>
            <Send size={18} />
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
