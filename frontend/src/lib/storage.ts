import type { InterviewHistoryItem } from "../types";

const HISTORY_STORAGE_KEY = "abtalks.interviewHistory";

export function loadInterviewHistory(): InterviewHistoryItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InterviewHistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function saveInterviewHistory(history: InterviewHistoryItem[]): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}
