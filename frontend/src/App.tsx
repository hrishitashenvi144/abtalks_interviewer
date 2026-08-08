import { useState } from "react";
import type { Candidate, Feedback, Screen } from "./types";
import CandidateSelect from "./components/CandidateSelect";
import ChatInterview from "./components/ChatInterview";
import FeedbackReport from "./components/FeedbackReport";
import { startInterview } from "./lib/api";

function App() {
  const [screen, setScreen] = useState<Screen>("select");
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [initialMessage, setInitialMessage] = useState<string>("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  async function handleSelectCandidate(c: Candidate) {
    setStarting(true);
    setStartError(null);
    const newSessionId = crypto.randomUUID();
    try {
      const res = await startInterview(newSessionId, c);
      setCandidate(c);
      setSessionId(newSessionId);
      setInitialMessage(res.reply);
      setScreen("interview");
    } catch (e: any) {
      setStartError(e.message || "Could not start the interview. Check the backend is running.");
    } finally {
      setStarting(false);
    }
  }

  function handleComplete(fb: Feedback) {
    setFeedback(fb);
    setScreen("feedback");
  }

  function handleRestart() {
    setCandidate(null);
    setSessionId("");
    setInitialMessage("");
    setFeedback(null);
    setScreen("select");
  }

  if (screen === "select") {
    return (
      <>
        <CandidateSelect onSelect={handleSelectCandidate} />
        {starting && (
          <div className="fixed inset-0 bg-bg/80 flex items-center justify-center font-mono text-sm text-amber">
            Starting interview session…
          </div>
        )}
        {startError && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-lg border border-coral/40 bg-surface px-4 py-3 text-coral text-sm font-mono max-w-md text-center">
            {startError}
          </div>
        )}
      </>
    );
  }

  if (screen === "interview" && candidate) {
    return (
      <ChatInterview
        candidate={candidate}
        sessionId={sessionId}
        initialMessage={initialMessage}
        onComplete={handleComplete}
      />
    );
  }

  if (screen === "feedback" && candidate && feedback) {
    return (
      <FeedbackReport candidate={candidate} feedback={feedback} onRestart={handleRestart} />
    );
  }

  return null;
}

export default App;
