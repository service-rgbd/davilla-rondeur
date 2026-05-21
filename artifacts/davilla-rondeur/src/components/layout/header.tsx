import { Link, useLocation } from "wouter";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { ShoppingBag, Search, User, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const [location, setLocation] = useLocation();
  const sessionId = getSessionId();
  const { data: cart } = useGetCart({ sessionId }, { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } });
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      <div className="bg-primary text-primary-foreground text-xs py-1.5 px-4 flex justify-between items-center hidden md:flex font-sans tracking-wide">
        <span>Livraison discrète & sécurisée</span>
        <span>Paiement 100% sécurisé</span>
        <span>Service clientèle confidentiel</span>
      </div>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300 border-b border-transparent",
          isScrolled ? "bg-background/95 backdrop-blur-md border-border py-3 shadow-sm" : "bg-background py-5"
        )}
      >
        <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between">
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 -ml-2 text-foreground"
            onClick={() => setMobileMenuOpen(true)}
            data-testid="button-mobile-menu"
          >
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </button>

          {/* Logo */}
          <Link href="/" className="text-2xl md:text-3xl font-serif tracking-wide text-foreground flex-shrink-0" data-testid="link-home">
            Davilla Rondeur
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "text-sm font-sans tracking-wide transition-colors hover:text-primary",
                  location === link.href ? "text-primary font-medium" : "text-foreground/80"
                )}
                data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Icons */}
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

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in slide-in-from-left">
          <div className="p-5 flex justify-between items-center border-b border-border">
            <span className="text-2xl font-serif tracking-wide text-foreground">Davilla</span>
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
                  location === link.href ? "text-primary" : "text-foreground/80"
                )}
                data-testid={`link-mobile-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
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
