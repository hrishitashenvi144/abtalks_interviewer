import { useState } from "react";
import type { Candidate, Feedback, InterviewTurnResponse, Screen } from "./types";
import CandidateSelect from "./components/CandidateSelect";
import ChatInterview from "./components/ChatInterview";
import FeedbackReport from "./components/FeedbackReport";
import { startInterview } from "./lib/api";

function App() {
  const [screen, setScreen] = useState<Screen>("select");
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [initialTurn, setInitialTurn] = useState<InterviewTurnResponse | null>(null);
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
      setInitialTurn(res);
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
    setInitialTurn(null);
    setFeedback(null);
    setScreen("select");
  }

  if (screen === "select") {
    return (
      <>
        <CandidateSelect onSelect={handleSelectCandidate} />
        {starting && <div className="overlay">Starting interview session…</div>}
        {startError && <div className="toast toast--error">{startError}</div>}
      </>
    );
  }

  if (screen === "interview" && candidate && initialTurn) {
    return (
      <ChatInterview
        candidate={candidate}
        sessionId={sessionId}
        initialTurn={initialTurn}
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
