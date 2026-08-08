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
  return (
    <div className="feedback-card">
      <p className={`pill pill--${accent}`}>
        {icon} {title}
      </p>
      <ul className="feedback-list">
        {items.map((item, i) => (
          <li key={i} className="feedback-list-item">
            <span />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="metric-card">
      <p className="metric-title">{title}</p>
      <p>{value}</p>
    </div>
  );
}

export default function FeedbackReport({ candidate, feedback, onRestart }: Props) {
  const score = feedback.overallScore ?? Math.max(40, Math.min(96, 56 + (feedback.strengths.length - feedback.gaps.length) * 8));
  const rating = score >= 80 ? "Strong" : score >= 60 ? "Balanced" : "Needs Improvement";

  return (
    <div className="page feedback-page">
      <div className="page-inner">
        <div className="page-header page-header--narrow">
          <div>
            <p className="eyebrow">Interview Complete</p>
            <h1>{candidate.member.name}</h1>
            <p className="subheading">{candidate.member.jobRole}</p>
          </div>
          <div className="score-card score-card--large">
            <span className="score-label">Overall signal</span>
            <strong>{rating}</strong>
            <span className="score-meta">Score {score}%</span>
          </div>
        </div>

        <div className="summary-card">
          <p className="section-label">Summary</p>
          <p>{feedback.summary}</p>
        </div>

        <div className="feedback-metrics-grid">
          <MetricCard title="Technical understanding" value={feedback.technicalUnderstanding} />
          <MetricCard title="Reasoning" value={feedback.reasoning} />
          <MetricCard title="Communication" value={feedback.communication} />
          <MetricCard title="Depth" value={feedback.depth} />
        </div>

        <div className="grid grid--3cols">
          <Section title="Strengths" items={feedback.strengths} accent="teal" icon="✓" />
          <Section title="Weaknesses" items={feedback.gaps} accent="coral" icon="⚠" />
          <Section title="Recommendations" items={feedback.next} accent="amber" icon="→" />
        </div>

        {feedback.curriculumRevisit && feedback.curriculumRevisit.length > 0 && (
          <Section
            title="Curriculum areas to revisit"
            items={feedback.curriculumRevisit}
            accent="teal"
            icon="📚"
          />
        )}

        <button className="button button--secondary" onClick={onRestart}>
          Start New Interview
        </button>
      </div>
    </div>
  );
}
