import { useEffect, useRef, useState } from "react";
import type { ChatMessage, Candidate, Feedback, InterviewTurnResponse } from "../types";
import { sendMessage, skipQuestion, endInterviewNow } from "../lib/api";
interface Props {
  candidate: Candidate;
  sessionId: string;
  initialTurn: InterviewTurnResponse;
  onComplete: (result: { feedback: Feedback; transcript: ChatMessage[] }) => void;
}

export default function ChatInterview({
  candidate,
  sessionId,
  initialTurn,
  onComplete,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "agent", content: initialTurn.reply },
  ]);
  const [currentTopic, setCurrentTopic] = useState<string | null>(initialTurn.topicTitle ?? null);
  const [questionNumber, setQuestionNumber] = useState<number>(initialTurn.questionNumber ?? 1);
  const [topicPosition, setTopicPosition] = useState<number | null>(initialTurn.topicPosition ?? null);
  const [topicTotal, setTopicTotal] = useState<number | null>(initialTurn.topicTotal ?? null);
  const [isFollowup, setIsFollowup] = useState<boolean>(initialTurn.isFollowup ?? false);
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

    const candidateMessage: ChatMessage = { role: "candidate", content: text };
    setMessages((prev) => [...prev, candidateMessage]);
    setInput("");
    setWaiting(true);
    setError(null);

    try {
      const res = await sendMessage(sessionId, text);
      const assistantMessage: ChatMessage = { role: "agent", content: res.reply };
      const nextMessages = [...messages, candidateMessage, assistantMessage];
      setMessages(nextMessages);
      setCurrentTopic((prev) => res.topicTitle ?? prev);
      setQuestionNumber(res.questionNumber ?? questionNumber + 1);
      setTopicPosition(res.topicPosition ?? topicPosition);
      setTopicTotal(res.topicTotal ?? topicTotal);
      setIsFollowup(Boolean(res.isFollowup));

      if (res.done && res.feedback) {
        onComplete({ feedback: res.feedback, transcript: nextMessages });
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

  async function handleSkip() {
    if (waiting) return;
    setWaiting(true);
    setError(null);

    const skipNote: ChatMessage = { role: "candidate", content: "(Skipped this question)" };
    setMessages((prev) => [...prev, skipNote]);

    try {
      const res = await skipQuestion(sessionId);
      const assistantMessage: ChatMessage = { role: "agent", content: res.reply };
      const nextMessages = [...messages, skipNote, assistantMessage];
      setMessages(nextMessages);
      setCurrentTopic((prev) => res.topicTitle ?? prev);
      setQuestionNumber(res.questionNumber ?? questionNumber + 1);
      setTopicPosition(res.topicPosition ?? topicPosition);
      setTopicTotal(res.topicTotal ?? topicTotal);
      setIsFollowup(Boolean(res.isFollowup));

      if (res.done && res.feedback) {
        onComplete({ feedback: res.feedback, transcript: nextMessages });
      }
    } catch (e: any) {
      setError(e.message || "Could not skip this question.");
    } finally {
      setWaiting(false);
    }
  }

  async function handleEndNow() {
    if (waiting) return;
    const confirmed = window.confirm("End the interview now and generate feedback based on what's been discussed so far?");
    if (!confirmed) return;

    setWaiting(true);
    setError(null);

    try {
      const res = await endInterviewNow(sessionId);
      if (res.done && res.feedback) {
        onComplete({ feedback: res.feedback, transcript: messages });
      }
    } catch (e: any) {
      setError(e.message || "Could not end the interview.");
      setWaiting(false);
    }
  }

  return (
    <div className="page interview-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Live interview</p>
          <h1>{candidate.member.name}</h1>
          <p className="subheading">
            {candidate.member.jobRole} • {candidate.member.yearsExperience} years experience
          </p>
        </div>
        <div className="interview-metadata">
          <div className="meta-pill">
            Question {questionNumber}
            {topicPosition && topicTotal ? ` · Topic ${topicPosition}/${topicTotal}` : ""}
          </div>
          <div className="meta-pill">{currentTopic || "Preparing topic…"}</div>
          {isFollowup && <div className="meta-pill meta-pill--accent">Follow-up</div>}
        </div>
      </header>

      <main className="chat-panel">
        <div className="chat-thread">
          {messages.map((m, i) => (
            <div key={i} className={`chat-message ${m.role === "candidate" ? "chat-message--user" : "chat-message--agent"}`}>
              <p>{m.content}</p>
            </div>
          ))}

          {waiting && (
            <div className="chat-message chat-message--agent chat-message--typing">
              <div className="typing-indicator">
                <span />
                <span />
                <span />
              </div>
              <span>Thinking…</span>
            </div>
          )}

          {error && <div className="toast toast--error">{error}</div>}
          <div ref={bottomRef} />
        </div>
      </main>
<footer className="chat-input-bar">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={waiting}
          placeholder="Type your answer…"
          rows={1}
        />
        <button onClick={handleSend} disabled={waiting || !input.trim()}>
          Send
        </button>
        <button
          className="button button--secondary"
          onClick={handleSkip}
          disabled={waiting}
          title="Skip this question and move to the next topic"
        >
          Skip Question
        </button>
        <button
          className="button button--secondary"
          onClick={handleEndNow}
          disabled={waiting}
          title="End the interview now and see your results"
        >
          End Interview
        </button>
      </footer>
      
    </div>
  );
}
