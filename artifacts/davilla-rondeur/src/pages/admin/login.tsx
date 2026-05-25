import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminLogin } from "@workspace/api-client-react";
import { setAdminSession, isAdminLoggedIn } from "@/lib/admin-auth";
import { useEffect } from "react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAdminLoggedIn()) {
      setLocation("/admin/products");
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
          setLocation("/admin/products");
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-md border border-border bg-background p-8">
        <h1 className="text-2xl font-sans font-bold mb-2">Administration</h1>
        <p className="font-sans text-sm text-muted-foreground mb-8">Davilla Rondeur — back-office</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="admin-email" className="font-sans text-xs uppercase tracking-widest">
              Email
            </label>
            <Input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-none h-11"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="admin-password" className="font-sans text-xs uppercase tracking-widest">
              Mot de passe
            </label>
            <Input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-none h-11"
            />
          </div>

          {loginMutation.isError && (
            <p className="text-sm text-destructive font-sans">
              {loginMutation.error.data && typeof loginMutation.error.data === "object" && "error" in loginMutation.error.data
                ? String((loginMutation.error.data as { error: string }).error)
                : "Connexion impossible"}
            </p>
          )}

          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded-none h-12 font-sans uppercase tracking-widest text-xs"
          >
            {loginMutation.isPending ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <p className="mt-8 text-center">
          <Link href="/" className="font-sans text-xs text-muted-foreground hover:text-foreground">
            ← Retour à la boutique
          </Link>
        </p>
      </div>
    </div>
  );
}
