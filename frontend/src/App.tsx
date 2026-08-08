import { useEffect, useState } from "react";
import type {
  Candidate,
  ChatMessage,
  Feedback,
  InterviewHistoryItem,
  InterviewTurnResponse,
  Screen,
} from "./types";
import CandidateSelect from "./components/CandidateSelect";
import ChatInterview from "./components/ChatInterview";
import FeedbackReport from "./components/FeedbackReport";
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import { startInterview } from "./lib/api";
import { loadInterviewHistory, saveInterviewHistory } from "./lib/storage";

const navItems: { id: Screen; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "candidates", label: "New Interview" },
  { id: "history", label: "History" },
  { id: "results", label: "Results" },
  { id: "settings", label: "Settings" },
];

function getScoreFromFeedback(feedback: Feedback): number {
  if (typeof feedback.overallScore === "number") {
    return feedback.overallScore;
  }

  return Math.max(40, Math.min(96, 52 + (feedback.strengths.length - feedback.gaps.length) * 8));
}

function getRating(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Balanced";
  return "Needs Improvement";
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [initialTurn, setInitialTurn] = useState<InterviewTurnResponse | null>(null);
  const [history, setHistory] = useState<InterviewHistoryItem[]>([]);
  const [selectedResult, setSelectedResult] = useState<InterviewHistoryItem | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [interviewStartAt, setInterviewStartAt] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadInterviewHistory());
  }, []);

  async function handleSelectCandidate(c: Candidate) {
    setStartError(null);
    const newSessionId = crypto.randomUUID();
    try {
      const res = await startInterview(newSessionId, c);
      setCandidate(c);
      setSessionId(newSessionId);
      setInitialTurn(res);
      setSelectedResult(null);
      setInterviewStartAt(new Date().toISOString());
      setScreen("interview");
    } catch (e: any) {
      setStartError(e.message || "Could not start the interview. Check the backend is running.");
    }
  }

  function saveResult(result: { feedback: Feedback; transcript: ChatMessage[] }) {
    const score = getScoreFromFeedback(result.feedback);
    const record: InterviewHistoryItem = {
      id: crypto.randomUUID(),
      sessionId,
      createdAt: interviewStartAt ?? new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      candidate: candidate as Candidate,
      feedback: result.feedback,
      transcript: result.transcript,
      score,
      rating: getRating(score),
    };

    const nextHistory = [record, ...history];
    setHistory(nextHistory);
    saveInterviewHistory(nextHistory);
    setSelectedResult(record);
    setScreen("results");
  }

  function handleComplete(result: { feedback: Feedback; transcript: ChatMessage[] }) {
    saveResult(result);
  }

  function handleViewResult(entry: InterviewHistoryItem) {
    setSelectedResult(entry);
    setScreen("results");
  }

  function handleStartInterview() {
    setStartError(null);
    setScreen("candidates");
  }

  function handleOpenHistory() {
    setScreen("history");
  }

  function handleShowDashboard() {
    setScreen("dashboard");
  }

  function renderContent() {
    switch (screen) {
      case "dashboard":
        return <Dashboard history={history} onStartInterview={handleStartInterview} onOpenHistory={handleOpenHistory} />;
      case "candidates":
        return <CandidateSelect onSelect={handleSelectCandidate} />;
      case "interview":
        return (
          candidate && initialTurn ? (
            <ChatInterview
              candidate={candidate}
              sessionId={sessionId}
              initialTurn={initialTurn}
              onComplete={handleComplete}
            />
          ) : (
            <div className="page empty-page">
              <div className="page-inner">
                <div className="empty-panel">
                  <p>Interview session is not available.</p>
                  <button className="button button--primary" onClick={handleStartInterview}>
                    Start a new interview
                  </button>
                </div>
              </div>
            </div>
          )
        );
      case "results":
        return selectedResult ? (
          <div className="page results-page">
            <div className="page-inner">
              <header className="page-header page-header--narrow">
                <div>
                  <p className="eyebrow">Interview results</p>
                  <h1>{selectedResult.candidate.member.name}</h1>
                  <p className="subheading">{selectedResult.candidate.member.jobRole}</p>
                </div>
                <div className="conclusion-panel">
                  <p className="section-label">Final score</p>
                  <div className="score-card score-card--large">
                    <strong>{selectedResult.rating}</strong>
                    <span className="score-meta">{selectedResult.score}%</span>
                  </div>
                </div>
              </header>
              <FeedbackReport
                candidate={selectedResult.candidate}
                feedback={selectedResult.feedback}
                transcript={selectedResult.transcript}
                onRestart={handleStartInterview}
              />
            </div>
          </div>
        ) : (
          <div className="page empty-page">
            <div className="page-inner">
              <div className="empty-panel">
                <p>No result is available yet.</p>
                <button className="button button--primary" onClick={handleStartInterview}>
                  Start your first interview
                </button>
              </div>
            </div>
          </div>
        );
      case "history":
        return <History history={history} onViewResult={handleViewResult} onStartInterview={handleStartInterview} />;
      case "settings":
        return (
          <div className="page settings-page">
            <div className="page-inner">
              <header className="page-header page-header--narrow">
                <div>
                  <p className="eyebrow">Settings</p>
                  <h1>Product settings</h1>
                  <p className="subheading">
                    Keep your interview platform simple and ready for live sessions. Settings are minimal by design.
                  </p>
                </div>
              </header>
              <div className="panel-card">
                <p className="section-label">Local data</p>
                <p>
                  Interview session results are stored locally in your browser so your history remains available across refreshes. No backend persistence is required for this demo.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-top" onClick={handleShowDashboard}>
          <div className="brand">
            <span className="brand-mark">AB</span>
            <div>
              <strong>ABTalks</strong>
              <span>Interview Studio</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${screen === item.id ? "nav-link--active" : ""}`}
              onClick={() => setScreen(item.id)}
              aria-current={screen === item.id ? "page" : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="profile">
            <div className="avatar">H</div>
            <div className="profile-meta">
              <strong>Hrishita</strong>
              <span className="profile-role">Product</span>
            </div>
            <button className="button button--ghost">Upgrade</button>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <div className="brand compact" onClick={handleShowDashboard}>
              <span className="brand-mark">AB</span>
              <div>
                <strong>ABTalks</strong>
              </div>
            </div>
          </div>
          <div className="topbar-right">
            {/* future: search / notifications */}
          </div>
        </header>

        <main className="app-content">
          {startError && <div className="toast toast--error">{startError}</div>}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
