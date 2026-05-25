import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { setAdminSession, isAdminLoggedIn } from "@/lib/admin-auth";
import { BrandLogo } from "@/components/brand-logo";

const LOGIN_IMAGE = "/images/photo_2026-05-24%2017.46.23.jpeg";

const fieldClassName =
  "w-full bg-transparent border-0 border-b border-foreground/25 py-3 font-sans text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-foreground transition-colors";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAdminLoggedIn()) {
      setLocation("/admin");
    }
  }, [setLocation]);

  const loginMutation = useAdminLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          setAdminSession(data.token, data.email);
          setLocation("/admin");
        },
      },
    );
  };

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
          <h1 className="font-sans text-3xl font-bold tracking-tight mb-2">Connexion</h1>
          <p className="font-sans text-sm text-muted-foreground mb-12">
            Accès réservé à l&apos;équipe Davilla Rondeur
          </p>

          <form onSubmit={handleSubmit} className="space-y-10">
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

            {loginMutation.isError && (
              <p className="font-sans text-sm text-destructive">
                {loginMutation.error.data &&
                typeof loginMutation.error.data === "object" &&
                "error" in loginMutation.error.data
                  ? String((loginMutation.error.data as { error: string }).error)
                  : "Connexion impossible"}
              </p>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-foreground text-background py-4 font-sans text-[11px] uppercase tracking-[0.3em] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loginMutation.isPending ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="mt-14">
            <Link
              href="/"
              className="font-sans text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Retour à la boutique
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
