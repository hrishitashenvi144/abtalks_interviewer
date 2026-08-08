import { useEffect, useRef, useState } from "react";
import type { ChatMessage, Candidate, Feedback } from "../types";
import { sendMessage } from "../lib/api";

interface Props {
  candidate: Candidate;
  sessionId: string;
  initialMessage: string;
  onComplete: (feedback: Feedback) => void;
}

export default function ChatInterview({
  candidate,
  sessionId,
  initialMessage,
  onComplete,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "agent", content: initialMessage },
  ]);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, waiting]);

  async function handleSend() {
    const text = input.trim();
    if (!text || waiting) return;

    setMessages((prev) => [...prev, { role: "candidate", content: text }]);
    setInput("");
    setWaiting(true);
    setError(null);

    try {
      const res = await sendMessage(sessionId, text);
      setMessages((prev) => [...prev, { role: "agent", content: res.reply }]);
      if (res.done && res.feedback) {
        onComplete(res.feedback);
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong reaching the interview agent.");
    } finally {
      setWaiting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      <header className="border-b border-border px-5 py-4 sm:px-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber">
          Live Interview
        </p>
        <h1 className="font-semibold text-lg">
          {candidate.member.name} <span className="text-muted font-normal">· {candidate.member.jobRole}</span>
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-10">
        <div className="mx-auto max-w-2xl flex flex-col gap-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`msg-in flex ${m.role === "candidate" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
                  m.role === "candidate"
                    ? "bg-amber text-bg rounded-br-sm"
                    : "bg-surface border border-border text-ink rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {waiting && (
            <div className="flex justify-start msg-in">
              <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-muted typing-dot" style={{ animationDelay: "0s" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted typing-dot" style={{ animationDelay: "0.15s" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted typing-dot" style={{ animationDelay: "0.3s" }} />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-coral text-sm font-mono">
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border px-4 py-4 sm:px-10">
        <div className="mx-auto max-w-2xl flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={waiting}
            placeholder="Type your answer…"
            rows={1}
            className="flex-1 resize-none rounded-xl bg-surface border border-border focus:border-amber/60 outline-none px-4 py-3 text-[15px] text-ink placeholder:text-muted disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={waiting || !input.trim()}
            className="rounded-xl bg-amber text-bg font-semibold px-5 py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
