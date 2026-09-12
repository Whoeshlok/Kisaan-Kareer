"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Send, Camera } from "lucide-react";
import { getFarmerProfile } from "@/lib/supabaseClient";
import { requestRecommendation } from "@/lib/getRecommendationClient";

const DEMO_PROFILE_ID = process.env.NEXT_PUBLIC_DEMO_PROFILE_ID || "demo-farmer";

export default function AskPage() {
  const [profile, setProfile] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    getFarmerProfile(DEMO_PROFILE_ID).then(setProfile);

    // Voice-first architecture — English-only for the demo, language pack later.
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-IN";
        recognition.interimResults = false;
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setQuestion(transcript);
          setListening(false);
        };
        recognition.onerror = () => setListening(false);
        recognition.onend = () => setListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  function startListening() {
    if (!recognitionRef.current) return;
    setListening(true);
    recognitionRef.current.start();
  }

  async function ask(q) {
    if (!q?.trim()) return;
    setLoading(true);
    setAnswer(null);
    try {
      const result = await requestRecommendation(profile, { question: q }, "ask");
      setAnswer(result.answer);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-5 pt-4 flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-ink-900">Ask Kisaan Kareer</h1>
      <p className="text-sm text-ink-600">Tell me in the way that feels easiest — speak, type, or show a photo.</p>

      <div className="flex items-center gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(question)}
          placeholder="Should I water today?"
          className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900"
        />
        <button
          onClick={() => ask(question)}
          className="w-10 h-10 rounded-md bg-green-800 flex items-center justify-center"
        >
          <Send size={16} color="#fff" />
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={startListening}
          className={`flex-1 rounded-md border border-line py-3 flex flex-col items-center gap-1 ${
            listening ? "bg-green-100" : "bg-paper"
          }`}
        >
          <Mic size={18} color={listening ? "var(--green-800)" : "var(--ink-600)"} />
          <span className="text-xs text-ink-600">{listening ? "Listening..." : "Speak"}</span>
        </button>
        <button className="flex-1 rounded-md border border-line py-3 flex flex-col items-center gap-1 bg-paper">
          <Camera size={18} color="var(--ink-600)" />
          <span className="text-xs text-ink-600">Show a photo</span>
        </button>
      </div>

      {loading && <p className="text-sm text-ink-400">Thinking...</p>}

      {answer && (
        <div className="rounded-md bg-paper border border-line p-4">
          <p className="text-sm text-ink-900">{answer}</p>
        </div>
      )}
    </div>
  );
}
