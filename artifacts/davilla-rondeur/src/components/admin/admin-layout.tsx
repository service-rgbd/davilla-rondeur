import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { clearAdminSession, getAdminEmail, isAdminLoggedIn } from "@/lib/admin-auth";
import { adminRoutes } from "@/lib/admin-routes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: adminRoutes.home, label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: adminRoutes.orders, label: "Commandes", icon: ShoppingBag },
  { href: adminRoutes.products, label: "Produits", icon: Package },
  { href: adminRoutes.contacts, label: "Contacts", icon: Users },
  { href: adminRoutes.settings, label: "Paramètres", icon: Settings },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  onNavigate?: () => void;
}) {
  const [location] = useLocation();
  const active = exact ? location === href : location.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
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

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const email = getAdminEmail();
  const [, setLocation] = useLocation();

  return (
    <>
      <nav className="flex-1 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} onNavigate={onNavigate} />
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
          <a href={adminRoutes.storeUrl} target="_blank" rel="noreferrer">
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
            setLocation(adminRoutes.login);
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      setLocation(adminRoutes.login);
    }
  }, [setLocation]);

  if (!isAdminLoggedIn()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col lg:flex-row">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-muted/40 min-h-screen">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div>
            <p className="font-sans text-sm font-bold uppercase tracking-[0.2em]">Davilla</p>
            <p className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground">
              Portail admin
            </p>
          </div>
        </div>
        <SidebarNav />
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="h-14 flex items-center justify-between px-4">
            <div>
              <p className="font-sans text-sm font-bold uppercase tracking-[0.15em]">Davilla</p>
              <p className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground">
                Portail
              </p>
            </div>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-none shrink-0">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(100vw-2rem,20rem)] p-0 rounded-none">
                <SheetHeader className="h-16 flex flex-row items-center px-6 border-b border-border text-left">
                  <SheetTitle className="font-sans text-sm font-bold uppercase tracking-[0.2em]">
                    Navigation
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-[calc(100%-4rem)] bg-muted/40">
                  <SidebarNav onNavigate={() => setMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full min-w-0">{children}</main>
      </div>
    </div>
  );
}
