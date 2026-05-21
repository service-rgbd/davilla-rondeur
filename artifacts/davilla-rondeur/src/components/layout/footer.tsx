import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-[#111111] text-[#E8E2DA] pt-16 pb-8 border-t-4 border-primary">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <h3 className="text-2xl font-serif tracking-wide text-white">Davilla Rondeur</h3>
            <p className="text-sm font-sans leading-relaxed text-[#E8E2DA]/70">
              La sensualité dessinée pour vos courbes. L'atelier de confiance pour la femme voluptueuse qui célèbre sa beauté.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-6">
            <h4 className="text-sm font-sans uppercase tracking-widest text-white">Navigation</h4>
            <ul className="space-y-3 text-sm font-sans">
              <li><Link href="/boutique" className="hover:text-white transition-colors" data-testid="link-footer-boutique">La Boutique</Link></li>
              <li><Link href="/univers" className="hover:text-white transition-colors" data-testid="link-footer-univers">L'Univers Davilla</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors" data-testid="link-footer-faq">Foire aux Questions</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors" data-testid="link-footer-contact">Contactez-nous</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-6">
            <h4 className="text-sm font-sans uppercase tracking-widest text-white">Légal</h4>
            <ul className="space-y-3 text-sm font-sans">
              <li><button className="hover:text-white transition-colors" data-testid="link-footer-cgv">CGV</button></li>
              <li><button className="hover:text-white transition-colors" data-testid="link-footer-privacy">Politique de confidentialité</button></li>
              <li><button className="hover:text-white transition-colors" data-testid="link-footer-cookies">Gestion des cookies</button></li>
              <li><button className="hover:text-white transition-colors" data-testid="link-footer-returns">Livraisons & Retours</button></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h4 className="text-sm font-sans uppercase tracking-widest text-white">L'Atelier</h4>
            <ul className="space-y-3 text-sm font-sans text-[#E8E2DA]/70">
              <li>Paris, France</li>
              <li>bonjour@davilla-rondeur.fr</li>
              <li>Du lundi au vendredi</li>
              <li>10h00 - 18h00</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#E8E2DA]/10 flex flex-col md:flex-row justify-between items-center text-xs font-sans text-[#E8E2DA]/50">
          <p>© {new Date().getFullYear()} Davilla Rondeur – Tous droits réservés.</p>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <button className="hover:text-white transition-colors" data-testid="link-social-ig">Instagram</button>
            <button className="hover:text-white transition-colors" data-testid="link-social-fb">Facebook</button>
            <button className="hover:text-white transition-colors" data-testid="link-social-pt">Pinterest</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
