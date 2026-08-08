export interface CandidateMember {
  id: string;
  name: string;
  jobRole: string;
  yearsExperience: number;
  education: string;
  status: string;
}

export interface CandidateMission {
  day: number;
  title: string;
  passed: boolean;
  attempts: number;
  skipped?: boolean;
}

export interface Candidate {
  member: CandidateMember;
  missions: CandidateMission[];
  [key: string]: unknown;
}

export interface ChatMessage {
  role: "agent" | "candidate";
  content: string;
}

export interface Feedback {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
}

export interface InterviewTurnResponse {
  reply: string;
  done: boolean;
  feedback?: Feedback;
}

export type Screen = "select" | "interview" | "feedback";
