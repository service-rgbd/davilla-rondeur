import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminLogin, useAdminVerifyTwoFactor } from "@workspace/api-client-react";
import { setAdminSession, isAdminLoggedIn } from "@/lib/admin-auth";
import { adminRoutes } from "@/lib/admin-routes";
import { BrandLogo } from "@/components/brand-logo";

const LOGIN_IMAGE = "/images/photo_2026-05-24%2017.46.23.jpeg";

const fieldClassName =
  "w-full bg-transparent border-0 border-b border-foreground/25 py-3 font-sans text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-foreground transition-colors";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [challengeToken, setChallengeToken] = useState("");
  const [totpCode, setTotpCode] = useState("");

  useEffect(() => {
    if (isAdminLoggedIn()) {
      setLocation(adminRoutes.home);
    }
  }, [setLocation]);

  const loginMutation = useAdminLogin();
  const verifyTwoFactor = useAdminVerifyTwoFactor();

  const completeLogin = (token: string, userEmail: string) => {
    setAdminSession(token, userEmail);
    setLocation(adminRoutes.home);
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          if (data.requiresTwoFactor && data.challengeToken) {
            setChallengeToken(data.challengeToken);
            setStep("2fa");
            setTotpCode("");
            return;
          }
          if (data.token) {
            completeLogin(data.token, data.email);
          }
        },
      },
    );
  };

  const handleTwoFactorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyTwoFactor.mutate(
      { data: { challengeToken, code: totpCode.trim() } },
      {
        onSuccess: (data) => {
          if (data.token) {
            completeLogin(data.token, data.email);
          }
        },
      },
    );
  };

  const activeError = step === "2fa" ? verifyTwoFactor.error : loginMutation.error;
  const isPending = step === "2fa" ? verifyTwoFactor.isPending : loginMutation.isPending;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="relative hidden lg:block min-h-screen overflow-hidden">
        <img
          src={LOGIN_IMAGE}
          alt="Davilla Rondeur"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <BrandLogo inverted className="opacity-95 max-w-[180px] h-auto" />
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-white/70 mb-4">
              Espace privé
            </p>
            <h2 className="font-sans text-4xl font-light leading-tight max-w-md">
              Davilla Rondeur
            </h2>
            <p className="font-sans text-sm text-white/75 mt-4 max-w-sm leading-relaxed">
              Gérez vos commandes, votre catalogue et vos contacts depuis un tableau de bord
              dédié.
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-12 lg:hidden">
            <BrandLogo className="max-w-[160px] mb-8" />
          </div>

          <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-3">
            Administration
          </p>
          <h1 className="font-sans text-3xl font-bold tracking-tight mb-2">
            {step === "2fa" ? "Vérification 2FA" : "Connexion"}
          </h1>
          <p className="font-sans text-sm text-muted-foreground mb-12">
            {step === "2fa"
              ? "Saisissez le code à 6 chiffres de votre application d'authentification."
              : "Accès réservé à l'équipe Davilla Rondeur"}
          </p>

          {step === "credentials" ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-10">
              <div>
                <label
                  htmlFor="admin-email"
                  className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground block mb-3"
                >
                  Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldClassName}
                  placeholder="admin@davillarondeur.com"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground block mb-3"
                >
                  Mot de passe
                </label>
                <input
                  id="admin-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={fieldClassName}
                  placeholder="••••••••"
                />
              </div>

              {activeError && (
                <p className="font-sans text-sm text-destructive">
                  {activeError.data &&
                  typeof activeError.data === "object" &&
                  "error" in activeError.data
                    ? String((activeError.data as { error: string }).error)
                    : "Connexion impossible"}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-foreground text-background py-4 font-sans text-[11px] uppercase tracking-[0.3em] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isPending ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleTwoFactorSubmit} className="space-y-10">
              <div>
                <label
                  htmlFor="admin-totp"
                  className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground block mb-3"
                >
                  Code de vérification
                </label>
                <input
                  id="admin-totp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={`${fieldClassName} tracking-[0.35em] text-center text-lg`}
                  placeholder="000000"
                />
              </div>

              {activeError && (
                <p className="font-sans text-sm text-destructive">
                  {activeError.data &&
                  typeof activeError.data === "object" &&
                  "error" in activeError.data
                    ? String((activeError.data as { error: string }).error)
                    : "Code invalide"}
                </p>
              )}

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isPending || totpCode.length !== 6}
                  className="w-full bg-foreground text-background py-4 font-sans text-[11px] uppercase tracking-[0.3em] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isPending ? "Vérification..." : "Valider le code"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setChallengeToken("");
                    setTotpCode("");
                  }}
                  className="w-full font-sans text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
                >
                  ← Retour à la connexion
                </button>
              </div>
            </form>
          )}

          <p className="mt-14">
            <a
              href={adminRoutes.storeUrl}
              className="font-sans text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Retour à la boutique
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
