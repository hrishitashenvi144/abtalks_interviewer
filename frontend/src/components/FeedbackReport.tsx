import type { Candidate, Feedback } from "../types";

interface Props {
  candidate: Candidate;
  feedback: Feedback;
  onRestart: () => void;
}

function Section({
  title,
  items,
  accent,
  icon,
}: {
  title: string;
  items: string[];
  accent: "teal" | "coral" | "amber";
  icon: string;
}) {
  const accentClasses = {
    teal: "text-teal border-teal/30 bg-teal/5",
    coral: "text-coral border-coral/30 bg-coral/5",
    amber: "text-amber border-amber/30 bg-amber/5",
  }[accent];

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className={`font-mono text-[11px] uppercase tracking-[0.15em] mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 ${accentClasses}`}>
        {icon} {title}
      </p>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-ink/90">
            <span className="text-muted mt-1.5 w-1 h-1 rounded-full bg-current shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FeedbackReport({ candidate, feedback, onRestart }: Props) {
  return (
    <div className="min-h-screen bg-bg text-ink px-5 py-10 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber mb-3">
          Interview Complete
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">
          {candidate.member.name}'s Feedback Report
        </h1>
        <p className="text-muted mb-8">{candidate.member.jobRole}</p>

        <div className="rounded-xl border border-border bg-surface2 p-5 mb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted mb-2">
            Summary
          </p>
          <p className="text-[16px] leading-relaxed text-ink/95">{feedback.summary}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Section title="Strengths" items={feedback.strengths} accent="teal" icon="✓" />
          <Section title="Gaps" items={feedback.gaps} accent="coral" icon="!" />
          <Section title="Next Steps" items={feedback.next} accent="amber" icon="→" />
        </div>

        <button
          onClick={onRestart}
          className="rounded-xl bg-surface border border-border hover:border-amber/50 hover:bg-surface2 transition-colors px-5 py-3 text-sm font-semibold"
        >
          Start New Interview
        </button>
      </div>
    </div>
  );
}
