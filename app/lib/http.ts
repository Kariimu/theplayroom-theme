// app/lib/http.ts

/** Whether a failed request was answered 404 (the engine's API client throws ky's `HTTPError`). */
export function isNotFound(error: unknown): boolean {
  return (error as { response?: { status?: number } } | null)?.response?.status === 404;
}
