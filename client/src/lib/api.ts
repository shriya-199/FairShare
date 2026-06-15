import { demoApi, isDemoModeEnabled } from "../features/demo/demoMode";

const baseUrl = import.meta.env.VITE_API_URL || "";

export class ApiError extends Error {
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.details = details;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (isDemoModeEnabled()) {
    return demoApi<T>(path, options);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (response.status === 204) return undefined as T;

  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(data?.error?.message || "Request failed", data?.error?.details);
  }
  return data as T;
}

export function postJson<T>(path: string, body: unknown) {
  return api<T>(path, { method: "POST", body: JSON.stringify(body) });
}
