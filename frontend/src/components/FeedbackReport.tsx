import type { Candidate, Feedback } from "../types";
import { generateFeedbackPDF } from "../lib/pdfGenerator";

interface Props {
  candidate: Candidate;
  feedback: Feedback;
  transcript?: { role: "agent" | "candidate"; content: string }[];
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

export default function FeedbackReport({ candidate, feedback, transcript, onRestart }: Props) {
  const strengths = feedback.strengths ?? [];
  const gaps = feedback.gaps ?? [];
  const next = feedback.next ?? [];
  const curriculumRevisit = feedback.curriculumRevisit ?? [];
  const score = feedback.overallScore ?? Math.max(40, Math.min(96, 56 + (strengths.length - gaps.length) * 8));
  const rating = score >= 80 ? "Strong" : score >= 60 ? "Balanced" : "Needs Improvement";

  const handleDownload = () => {
    generateFeedbackPDF(candidate, feedback);
  };

  return (
    <div className="page feedback-page">
      <div className="page-inner">
        <div className="page-header page-header--narrow">
          <div>
            <p className="eyebrow">Interview Complete</p>
            <h1>{candidate.member.name}</h1>
            <p className="subheading">{candidate.member.jobRole}</p>
          </div>
          <div className="conclusion-panel">
            <div className="score-card score-card--large">
              <span className="score-label">Overall signal</span>
              <strong>{rating}</strong>
              <span className="score-meta">Score {score}%</span>
            </div>
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
          <Section title="Strengths" items={strengths} accent="teal" icon="✓" />
<Section title="Weaknesses" items={gaps} accent="coral" icon="⚠" />
<Section title="Recommendations" items={next} accent="amber" icon="→" />
        </div>

        {transcript && transcript.length > 0 && (
          <div className="transcript-card">
            <p className="section-label">Interview transcript</p>
            <div className="transcript-list">
              {transcript.map((message, index) => (
                <div key={index} className={`transcript-line transcript-line--${message.role}`}>
                  <span className="transcript-role">{message.role === "agent" ? "Interviewer" : "Candidate"}</span>
                  <p>{message.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {curriculumRevisit.length > 0 && (
          <Section
            title="Curriculum areas to revisit"
            items={curriculumRevisit}
            accent="teal"
            icon="📚"
          />
        )}

        <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", flexWrap: "wrap" }}>
          <button className="button button--primary" onClick={handleDownload}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: "0.5rem" }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Report
          </button>
          <button className="button button--secondary" onClick={onRestart}>
            Start New Interview
          </button>
        </div>
      </div>
    </div>
  );
}

