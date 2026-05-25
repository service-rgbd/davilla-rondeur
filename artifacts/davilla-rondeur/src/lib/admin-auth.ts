import { setAuthTokenGetter } from "@workspace/api-client-react";

const ADMIN_TOKEN_KEY = "davilla_admin_token";
const ADMIN_EMAIL_KEY = "davilla_admin_email";

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getAdminEmail(): string | null {
  try {
    return localStorage.getItem(ADMIN_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function setAdminSession(token: string, email: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_EMAIL_KEY, email);
  configureAdminAuth();
}

export function clearAdminSession(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_EMAIL_KEY);
  configureAdminAuth();
}

export function isAdminLoggedIn(): boolean {
  return Boolean(getAdminToken());
}

export function configureAdminAuth(): void {
  setAuthTokenGetter(() => getAdminToken());
}

configureAdminAuth();
