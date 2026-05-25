import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearAdminSession, getAdminEmail, isAdminLoggedIn } from "@/lib/admin-auth";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Commandes", icon: ShoppingBag },
  { href: "/admin/products", label: "Produits", icon: Package },
  { href: "/admin/contacts", label: "Contacts", icon: Users },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}) {
  const [location] = useLocation();
  const active = exact ? location === href : location.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 font-sans text-sm transition-colors border-l-2",
        active
          ? "border-foreground bg-background text-foreground font-medium"
          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-background/60",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

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
    <div className="min-h-screen bg-muted/20 flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-muted/40">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div>
            <p className="font-sans text-sm font-bold uppercase tracking-[0.2em]">Davilla</p>
            <p className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground">
              Administration
            </p>
          </div>
        </div>

        <nav className="flex-1 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          <p className="font-sans text-xs text-muted-foreground truncate px-1">{email}</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-none font-sans text-xs uppercase tracking-widest justify-start"
            asChild
          >
            <a href="https://davilla-rondeur.fr" target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Voir la boutique
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-none font-sans text-xs uppercase tracking-widest justify-start"
            onClick={() => {
              clearAdminSession();
              setLocation("/admin/login");
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="lg:hidden border-b border-border bg-background h-14 flex items-center justify-between px-4">
          <span className="font-sans text-sm font-semibold uppercase tracking-widest">Admin</span>
          <div className="flex gap-2 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-sans text-xs uppercase tracking-widest text-muted-foreground whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </header>

        <main className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
