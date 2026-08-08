import { useEffect, useState } from "react";
import type { Candidate } from "../types";
import { fetchCandidates } from "../lib/api";

interface Props {
  onSelect: (candidate: Candidate) => void;
}

function computeStats(candidate: Candidate) {
  const missions = candidate.missions ?? [];
  const total = missions.length;
  const completed = missions.filter((m) => m.passed).length;
  const firstTry = missions.filter((m) => m.passed && m.attempts === 1).length;
  return { total, completed, firstTry };
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
    <div className="min-h-screen bg-bg text-ink px-5 py-10 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber mb-3">
            ABTalks AI Cohort — Interview Session
          </p>
          <h1 className="text-3xl sm:text-4xl font-sans font-800 font-extrabold tracking-tight">
            Select a candidate to interview
          </h1>
          <p className="text-muted mt-3 max-w-xl">
            The agent reads each candidate's actual learning journey — completed
            missions, skips, and retries — and builds a personalized interview
            from it.
          </p>
        </div>

        {loading && (
          <div className="font-mono text-sm text-muted">Loading roster…</div>
        )}

        {error && (
          <div className="rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-coral text-sm font-mono">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.map((c) => {
              const stats = computeStats(c);
              return (
                <button
                  key={c.member.id}
                  onClick={() => onSelect(c)}
                  className="text-left rounded-xl border border-border bg-surface hover:bg-surface2 hover:border-amber/50 transition-colors p-5 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-ink text-base">
                        {c.member.name}
                      </div>
                      <div className="text-muted text-sm">{c.member.jobRole}</div>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-muted bg-surface2 border border-border rounded px-2 py-1 group-hover:text-amber group-hover:border-amber/40 transition-colors">
                      {c.member.id}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-teal border-t border-border pt-3 mt-1">
                    {stats.completed}/{stats.total} completed · {stats.firstTry} first-try
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
