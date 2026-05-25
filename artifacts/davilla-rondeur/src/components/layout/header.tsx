import { Link, useLocation } from "wouter";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { ShoppingBag, Search, User, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";

export function Header() {
  const [location, setLocation] = useLocation();
  const sessionId = getSessionId();
  const { data: cart } = useGetCart({ sessionId }, { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } });

  const [isScrolled, setIsScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 20);

      if (currentY <= 0) {
        setHeaderVisible(true);
      } else if (currentY > lastScrollY.current && currentY > 72) {
        setHeaderVisible(false);
      } else if (currentY < lastScrollY.current) {
        setHeaderVisible(true);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (headerVisible) return;
    setMobileMenuOpen(false);
  }, [headerVisible]);

  const itemCount = cart?.itemCount || 0;

  const navLinks = [
    { href: "/", label: "Accueil" },
    { href: "/boutique", label: "Boutique" },
    { href: "/univers", label: "Univers Davilla" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-50 w-full overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-in-out will-change-transform",
          headerVisible
            ? "max-h-48 opacity-100 translate-y-0"
            : "max-h-0 opacity-0 -translate-y-2 pointer-events-none",
        )}
      >
        <div className="bg-primary text-primary-foreground text-xs py-1 px-4 flex justify-between items-center hidden md:flex font-sans tracking-wide">
          <span>Livraison discrète & sécurisée</span>
          <span>Paiement 100% sécurisé</span>
          <span>Service clientèle confidentiel</span>
        </div>
        <header
          className={cn(
            "w-full border-b border-transparent",
            isScrolled ? "bg-background/95 backdrop-blur-md border-border py-1.5 shadow-sm" : "bg-background py-2",
          )}
        >
          <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between gap-3 min-h-0">
            <button
              className="md:hidden p-1.5 -ml-1.5 text-foreground shrink-0"
              onClick={() => setMobileMenuOpen(true)}
              data-testid="button-mobile-menu"
            >
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            </button>

            <Link href="/" className="flex-shrink-0 leading-none" data-testid="link-home">
              <BrandLogo size="lg" className="block h-[4.75rem] md:h-24 lg:h-28" />
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-sans tracking-wide transition-colors hover:text-primary",
                    location === link.href ? "text-primary font-medium" : "text-foreground/80",
                  )}
                  data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-3 md:space-x-5">
              <button className="text-foreground hover:text-primary transition-colors hidden sm:block" data-testid="button-search">
                <Search className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button className="text-foreground hover:text-primary transition-colors hidden sm:block" data-testid="button-account">
                <User className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <Link href="/panier" className="relative text-foreground hover:text-primary transition-colors p-1" data-testid="link-cart">
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in slide-in-from-left">
          <div className="p-5 flex justify-between items-center border-b border-border">
            <BrandLogo size="sm" />
            <button onClick={() => setMobileMenuOpen(false)} className="p-2" data-testid="button-close-menu">
              <X className="w-6 h-6" strokeWidth={1.5} />
            </button>
          </div>
          <nav className="flex flex-col p-6 space-y-6 flex-grow">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => {
                  setLocation(link.href);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "text-2xl font-serif text-left transition-colors",
                  location === link.href ? "text-primary" : "text-foreground/80",
                )}
                data-testid={`link-mobile-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="p-6 border-t border-border flex justify-around">
            <button className="flex flex-col items-center space-y-2 text-foreground/80" data-testid="button-mobile-search">
              <Search className="w-6 h-6" strokeWidth={1.5} />
              <span className="text-xs">Recherche</span>
            </button>
            <button className="flex flex-col items-center space-y-2 text-foreground/80" data-testid="button-mobile-account">
              <User className="w-6 h-6" strokeWidth={1.5} />
              <span className="text-xs">Compte</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
