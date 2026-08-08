import { useEffect, useState } from "react";
import type { Candidate } from "../types";
import { fetchCandidates } from "../lib/api";

interface Props {
  onSelect: (candidate: Candidate) => void;
}

function computeStats(candidate: Candidate) {
  const missions = candidate.missions ?? [];
  const total = missions.length;
  const completed = candidate.signals?.missionsCompleted ?? missions.filter((m) => m.passed).length;
  const firstTry = candidate.signals?.missionsFirstTry ?? missions.filter((m) => m.passed && m.attempts === 1).length;
  const commitDays = candidate.signals?.commitDays ?? 0;
  return { total, completed, firstTry, commitDays };
}

export default function CandidateSelect({ onSelect }: Props) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCandidates()
      .then(setCandidates)
      .catch((e) => setError(e.message || "Could not load candidates."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page select-page">
      <div className="page-inner">
        <header className="page-header">
          <div>
            <p className="eyebrow">ABTalks AI Cohort — Interview Session</p>
            <h1>Select the candidate to interview</h1>
            <p className="subheading">
              Pick a real interview profile and let the AI interviewer build a tailored, adaptive technical conversation.
            </p>
          </div>
          <div className="hero-panel">
            <p className="hero-title">Interview candidates from the current cohort.</p>
            <p className="hero-copy">Each profile includes completed missions, skips, retry signal, and curriculum alignment.</p>
          </div>
        </header>

        {loading && (
          <div className="empty-panel empty-loading">
            <p className="loading-title">Loading candidates…</p>
            <p className="loading-copy">Fetching the latest cohort roster. This may take a moment.</p>
          </div>
        )}

        {error && <div className="toast toast--error">{error}</div>}

        {!loading && !error && (
          <div className="candidate-grid">
            {candidates.map((c) => {
              const stats = computeStats(c);
              return (
                <button key={c.member.id} className="candidate-card" onClick={() => onSelect(c)}>
                  <div className="candidate-card__header">
                    <div>
                      <div className="candidate-name">{c.member.name}</div>
                      <div className="candidate-role">{c.member.jobRole}</div>
                    </div>
                    <span className="candidate-badge">{c.member.id}</span>
                  </div>
                  <div className="candidate-details">
                    <div className="candidate-detail"><strong>{stats.completed}</strong> / {stats.total} completed</div>
                    <div className="candidate-detail"><strong>{stats.firstTry}</strong> first-try</div>
                    <div className="candidate-detail"><strong>{stats.commitDays}</strong> commit days</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
