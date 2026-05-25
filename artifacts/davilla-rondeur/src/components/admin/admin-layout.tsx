import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { clearAdminSession, getAdminEmail, isAdminLoggedIn } from "@/lib/admin-auth";
import { useEffect } from "react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const email = getAdminEmail();

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  if (!isAdminLoggedIn()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin/products" className="font-sans font-semibold text-foreground uppercase tracking-widest text-sm">
              Davilla Admin
            </Link>
            <Link href="/admin/products" className="font-sans text-sm text-muted-foreground hover:text-foreground">
              Produits
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-sans text-xs text-muted-foreground hidden sm:inline">{email}</span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-none font-sans text-xs uppercase tracking-widest"
              onClick={() => {
                clearAdminSession();
                setLocation("/admin/login");
              }}
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 lg:px-8 py-10">{children}</main>
    </div>
  );
}
