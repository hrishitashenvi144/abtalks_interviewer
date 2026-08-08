import type { InterviewHistoryItem } from "../types";

interface Props {
  history: InterviewHistoryItem[];
  onStartInterview: () => void;
  onOpenHistory: () => void;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function Dashboard({ history, onStartInterview, onOpenHistory }: Props) {
  const interviewCount = history.length;
  const latest = history[0] ?? null;
  const averageScore = interviewCount
    ? Math.round(history.reduce((sum, item) => sum + item.score, 0) / interviewCount)
    : null;
  const latestRating = latest?.rating ?? "No interviews yet";
  const latestDate = latest ? new Date(latest.finishedAt).toLocaleDateString() : "—";

  return (
    <div className="page dashboard-page">
      <div className="page-inner">
        <header className="page-header">
          <div>
            <p className="eyebrow">ABTalks Interview Studio</p>
            <h1>Build stronger technical interviews with AI-driven coaching.</h1>
            <p className="subheading">
              Use candidate signals and curriculum progress to run adaptive interviews, capture performance, and turn every session into actionable feedback.
            </p>
          </div>
          <button className="button button--primary" onClick={onStartInterview}>
            Start New Interview
          </button>
        </header>

        <section className="dashboard-grid">
          <div className="hero-panel hero-panel--large">
            <p className="hero-title">Launch interviews with confidence.</p>
            <p className="hero-copy">
              ABTalks helps interviewers quickly assess candidate depth, keep conversations adaptive, and deliver polished feedback at the end of every session.
            </p>
            <div className="dashboard-actions">
              <button className="button button--secondary" onClick={onOpenHistory}>
                Review interview history
              </button>
              <button className="button button--ghost" onClick={onStartInterview}>
                Start another session
              </button>
            </div>
          </div>

          <div className="metrics-panel">
            <div className="panel-header">
              <p className="eyebrow">Performance overview</p>
              <p className="section-copy">Your recent interview outcomes and platform health at a glance.</p>
            </div>
            <div className="metrics-grid">
              <StatCard label="Interviews completed" value={interviewCount} />
              <StatCard label="Average score" value={averageScore ?? "—"} />
              <StatCard label="Latest rating" value={latestRating} />
              <StatCard label="Most recent" value={latestDate} />
            </div>
          </div>
        </section>

        <section className="insight-panel">
          <div className="panel-header">
            <p className="eyebrow">Quick improvement insights</p>
            <p className="section-copy">
              Review what the AI interview uncovered and keep track of the next most valuable coaching areas.
            </p>
          </div>
          {latest ? (
            <div className="insight-card">
              <div className="insight-content">
                <p className="insight-label">Latest interview with {latest.candidate.member.name}</p>
                <p>{latest.feedback.summary}</p>
              </div>
              <div className="insight-chip">{latest.feedback.next?.[0] ?? "No recommendation available"}</div>
            </div>
          ) : (
            <div className="empty-panel">
              <p>No interviews have been completed yet.</p>
              <p>Start your first session to collect candidate performance data and polish your outcomes.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
