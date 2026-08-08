import type { InterviewHistoryItem } from "../types";

interface Props {
  history: InterviewHistoryItem[];
  onViewResult: (entry: InterviewHistoryItem) => void;
  onStartInterview: () => void;
}

export default function History({ history, onViewResult, onStartInterview }: Props) {
  return (
    <div className="page history-page">
      <div className="page-inner">
        <header className="page-header page-header--narrow">
          <div>
            <p className="eyebrow">Interview history</p>
            <h1>Review past sessions</h1>
            <p className="subheading">
              See completed interviews, compare results, and continue refining candidate outcomes.
            </p>
          </div>
          <button className="button button--primary" onClick={onStartInterview}>
            Start a new interview
          </button>
        </header>

        {history.length === 0 ? (
          <div className="empty-panel">
            <p className="loading-title">No interviews yet</p>
            <p className="loading-copy">Your interview history will appear here after you complete sessions. Start a new interview to get started.</p>
            <div style={{ marginTop: '1rem' }}>
              <button className="button button--primary" onClick={onStartInterview}>Start your first interview</button>
            </div>
          </div>
        ) : (
          <div className="history-grid">
            {history.map((entry) => (
              <article key={entry.id} className="history-card">
                <div className="history-card__head">
                  <div>
                    <p className="history-title">{entry.candidate.member.name}</p>
                    <p className="history-meta">{entry.candidate.member.jobRole}</p>
                  </div>
                  <span className="pill pill--amber">{entry.rating}</span>
                </div>
                <div className="history-body">
                  <div>
                    <p className="history-stat">Score</p>
                    <strong>{entry.score}%</strong>
                  </div>
                  <div>
                    <p className="history-stat">Completed</p>
                    <strong>{new Date(entry.finishedAt).toLocaleString()}</strong>
                  </div>
                </div>
                <p className="history-summary">{entry.feedback.summary}</p>
                <button className="button button--secondary" onClick={() => onViewResult(entry)}>
                  View feedback
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
