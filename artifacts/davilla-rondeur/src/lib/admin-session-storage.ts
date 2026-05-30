const ADMIN_2FA_PROMPT_DISMISSED_KEY = "davilla_admin_2fa_prompt_dismissed";

export function isTwoFactorPromptDismissed(): boolean {
  try {
    return localStorage.getItem(ADMIN_2FA_PROMPT_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function dismissTwoFactorPrompt(): void {
  localStorage.setItem(ADMIN_2FA_PROMPT_DISMISSED_KEY, "true");
}

export function clearTwoFactorPromptDismissed(): void {
  localStorage.removeItem(ADMIN_2FA_PROMPT_DISMISSED_KEY);
}
