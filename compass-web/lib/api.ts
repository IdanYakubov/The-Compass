import type {
  CompleteMilestoneResult,
  Roadmap,
  Today,
  Unlocks,
  VentureSummary,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5080/api/v1";

/** Shape of the API's 409 "rule violation" responses (domain invariants). */
export class ApiError extends Error {
  constructor(public status: number, detail: string) {
    super(detail);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail ?? body.title ?? detail;
    } catch {
      // non-JSON error body — keep the generic message
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  ventures: {
    list: () => request<VentureSummary[]>("/ventures"),
    today: (ventureId: string) => request<Today>(`/ventures/${ventureId}/today`),
    unlocks: (ventureId: string) => request<Unlocks>(`/ventures/${ventureId}/unlocks`),
  },
  roadmap: {
    get: (ventureId: string) => request<Roadmap>(`/ventures/${ventureId}/roadmap`),
    completeTask: (ventureId: string, taskId: string) =>
      request<void>(`/ventures/${ventureId}/tasks/${taskId}/complete`, { method: "POST" }),
    completeMilestone: (ventureId: string, milestoneId: string) =>
      request<CompleteMilestoneResult>(
        `/ventures/${ventureId}/milestones/${milestoneId}/complete`,
        { method: "POST" },
      ),
  },
};
