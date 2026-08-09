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
        {/* 1. Hero Blurb */}
        <header className="page-header page-header--lead">
          <div>
            <p className="eyebrow">ABTalks AI Interview Studio</p>
            <h1>ABTalks</h1>
            <p className="subheading">
              Personalized AI technical interviews based on real cohort progress data.
            </p>
          </div>
          <div className="header-actions">
            <button className="button button--primary button--cta" onClick={onStartInterview}>
              Start Interview
            </button>
            <button className="button button--secondary" onClick={onOpenHistory}>
              Interview history
            </button>
          </div>
        </header>

        {/* 2. How It Works Section */}
        <section className="how-it-works-section">
          <p className="eyebrow">Platform Overview</p>
          <h2 style={{ margin: "0.25rem 0 0.5rem", fontSize: "1.5rem" }}>How It Works</h2>
          <div className="how-it-works-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-label">Select a candidate profile</h3>
              <p className="step-desc">
                Choose a cohort member profile to tailor questions to their learning journey.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-label">Answer an adaptive AI interview tailored to their progress</h3>
              <p className="step-desc">
                Engage in dynamic, real-time technical questions shaped by cohort progress data.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-label">Get a structured, evidence-based feedback report</h3>
              <p className="step-desc">
                Receive instant competency evaluations, strengths, gaps, and recommendations.
              </p>
            </div>
          </div>
        </section>

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

        {/* 3. Small Footer Line */}
        <footer className="landing-footer">
          <p>
            Built for the <strong>ABTalks AI Cohort Hackathon</strong> &bull;{" "}
            <a
              href="https://www.abtalks.in"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              https://www.abtalks.in
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

