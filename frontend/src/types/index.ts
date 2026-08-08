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
  signals?: {
    commitDays: number;
    missionsCompleted: number;
    missionsFirstTry: number;
    [key: string]: unknown;
  };
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
  overallScore?: number;
  technicalUnderstanding?: string;
  reasoning?: string;
  communication?: string;
  depth?: string;
  curriculumRevisit?: string[];
}

export interface InterviewTurnResponse {
  reply: string;
  done: boolean;
  feedback?: Feedback;
  dayFocus?: number;
  topicTitle?: string;
  isFollowup?: boolean;
  questionNumber?: number;
  topicPosition?: number;
  topicTotal?: number;
}

export interface InterviewHistoryItem {
  id: string;
  sessionId: string;
  createdAt: string;
  finishedAt: string;
  candidate: Candidate;
  feedback: Feedback;
  transcript: ChatMessage[];
  score: number;
  rating: string;
}

export type Screen = "dashboard" | "candidates" | "interview" | "results" | "history" | "settings";
