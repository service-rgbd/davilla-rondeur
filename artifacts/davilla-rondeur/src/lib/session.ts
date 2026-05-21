export function getSessionId(): string {
  if (typeof window === "undefined") return "server-session";
  let sessionId = localStorage.getItem("davilla_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("davilla_session_id", sessionId);
  }
  return sessionId;
}
