import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="relative z-10 bg-[#111111] text-[#E8E2DA] pt-16 pb-8 border-t-4 border-primary isolate">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <h3 className="text-2xl font-serif tracking-wide text-white">Davilla Rondeur</h3>
            <p className="text-sm font-sans leading-relaxed text-[#E8E2DA]/70">
              La sensualité dessinée pour vos courbes. L&apos;atelier de confiance pour la femme voluptueuse qui célèbre sa beauté.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-sans uppercase tracking-widest text-white">Navigation</h4>
            <ul className="space-y-3 text-sm font-sans">
              <li>
                <Link href="/boutique" className="hover:text-white transition-colors" data-testid="link-footer-boutique">
                  La Boutique
                </Link>
              </li>
              <li>
                <Link href="/univers" className="hover:text-white transition-colors" data-testid="link-footer-univers">
                  L&apos;Univers Davilla
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors" data-testid="link-footer-faq">
                  Foire aux Questions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors" data-testid="link-footer-contact">
                  Contactez-nous
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-sans uppercase tracking-widest text-white">Légal</h4>
            <ul className="space-y-3 text-sm font-sans">
              <li>
                <button className="hover:text-white transition-colors" data-testid="link-footer-cgv">
                  CGV
                </button>
              </li>
              <li>
                <button className="hover:text-white transition-colors" data-testid="link-footer-privacy">
                  Politique de confidentialité
                </button>
              </li>
              <li>
                <button className="hover:text-white transition-colors" data-testid="link-footer-cookies">
                  Gestion des cookies
                </button>
              </li>
              <li>
                <button className="hover:text-white transition-colors" data-testid="link-footer-returns">
                  Livraisons & Retours
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-sans uppercase tracking-widest text-white">Contact</h4>
            <ul className="space-y-3 text-sm font-sans text-[#E8E2DA]/70">
              <li>
                <a href="mailto:support@davilla-rondeur.fr" className="hover:text-white transition-colors">
                  support@davilla-rondeur.fr
                </a>
              </li>
              <li>
                <a href="tel:+33603686294" className="hover:text-white transition-colors">
                  +33 6 03 68 62 94
                </a>
              </li>
              <li className="leading-relaxed">
                27 place des fleurs
                <br />
                Carrière sous Poissy 78955
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#E8E2DA]/10 flex flex-col gap-6 md:flex-row md:justify-between md:items-center text-xs font-sans text-[#E8E2DA]/50">
          <p>© {new Date().getFullYear()} Davilla Rondeur – Tous droits réservés.</p>
          <div className="flex space-x-4">
            <button className="hover:text-white transition-colors" data-testid="link-social-ig">
              Instagram
            </button>
            <button className="hover:text-white transition-colors" data-testid="link-social-fb">
              Facebook
            </button>
            <button className="hover:text-white transition-colors" data-testid="link-social-pt">
              Pinterest
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs font-sans text-[#E8E2DA]/40">
          Développé par :{" "}
          <a
            href="https://binary-security.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E8E2DA]/60 hover:text-white transition-colors underline-offset-2 hover:underline"
          >
            Binary-security
          </a>
        </p>
      </div>
    </footer>
  );
}
