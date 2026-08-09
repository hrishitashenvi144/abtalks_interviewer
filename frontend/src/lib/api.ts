import type { Candidate, InterviewTurnResponse } from "../types";

const API_BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000";

export async function fetchCandidates(): Promise<Candidate[]> {
  const res = await fetch(`${API_BASE_URL}/api/candidates`);
  if (!res.ok) {
    throw new Error(`Failed to load candidates (status ${res.status})`);
  }

  const data = await res.json();
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray((data as any).candidates)) {
    return (data as any).candidates;
  }

  throw new Error("Unexpected candidates response format from API.");
}

export async function startInterview(
  sessionId: string,
  candidate: Candidate
): Promise<InterviewTurnResponse> {
  const res = await fetch(`${API_BASE_URL}/api/interview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, candidate }),
  });
  if (!res.ok) {
    const detail = await safeErrorDetail(res);
    throw new Error(detail || `Failed to start interview (status ${res.status})`);
  }
  return res.json();
}

export async function sendMessage(
  sessionId: string,
  message: string
): Promise<InterviewTurnResponse> {
  const res = await fetch(`${API_BASE_URL}/api/interview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message }),
  });
  if (!res.ok) {
    const detail = await safeErrorDetail(res);
    throw new Error(detail || `Failed to send message (status ${res.status})`);
  }
  return res.json();
}
export async function skipQuestion(sessionId: string): Promise<InterviewTurnResponse> {
  const res = await fetch(`${API_BASE_URL}/api/interview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, skip: true }),
  });
  if (!res.ok) {
    const detail = await safeErrorDetail(res);
    throw new Error(detail || `Failed to skip question (status ${res.status})`);
  }
  return res.json();
}

export async function endInterviewNow(sessionId: string): Promise<InterviewTurnResponse> {
  const res = await fetch(`${API_BASE_URL}/api/interview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, endNow: true }),
  });
  if (!res.ok) {
    const detail = await safeErrorDetail(res);
    throw new Error(detail || `Failed to end interview (status ${res.status})`);
  }
  return res.json();
}

async function safeErrorDetail(res: Response): Promise<string | null> {
  try {
    const data = await res.json();
    return data?.detail ?? null;
  } catch {
    return null;
  }
}
