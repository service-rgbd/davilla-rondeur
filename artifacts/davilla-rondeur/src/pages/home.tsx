import { Layout } from "@/components/layout/layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListFeaturedProducts, useSubscribeNewsletter } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { Package, Lock, HeartHandshake, ArrowLeftRight, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { data: featuredProducts, isLoading } = useListFeaturedProducts();
  const subscribe = useSubscribeNewsletter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    subscribe.mutate(
      { data: { email } },
      {
        onSuccess: () => {
          toast({
            title: "Merci pour votre inscription",
            description: "Vous faites maintenant partie de l'univers Davilla.",
          });
          setEmail("");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Une erreur est survenue lors de l'inscription.",
          });
        }
      }
    );
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero.png" 
            alt="Davilla Rondeur" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto text-white mt-20">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif mb-6 drop-shadow-lg tracking-wide">
            Davilla Rondeur
          </h1>
          <p className="text-lg md:text-2xl font-sans font-light mb-12 opacity-90 tracking-wide max-w-2xl mx-auto">
            La sensualité dessinée pour vos courbes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button 
              asChild 
              className="bg-white text-black hover:bg-white/90 rounded-none px-12 py-7 font-sans uppercase tracking-widest text-sm w-full sm:w-auto"
            >
              <Link href="/boutique" data-testid="button-hero-primary">Découvrir la boutique</Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              className="bg-transparent text-white border-white hover:bg-white hover:text-black rounded-none px-12 py-7 font-sans uppercase tracking-widest text-sm w-full sm:w-auto"
            >
              <Link href="/boutique?filter=new" data-testid="button-hero-secondary">Voir les nouveautés</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Lingerie */}
            <Link href="/boutique?category=lingerie-body" className="group block relative overflow-hidden aspect-[3/4]" data-testid="link-category-lingerie">
              <img src="/images/category-lingerie.png" alt="Lingerie & Body" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                <h3 className="text-3xl font-serif mb-2">Lingerie & Body</h3>
                <p className="font-sans font-light text-sm mb-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">L'élégance au quotidien.</p>
                <span className="font-sans uppercase tracking-widest text-xs flex items-center gap-2">
                  Explorer <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
            
            {/* Accessories */}
            <Link href="/boutique?category=accessoires" className="group block relative overflow-hidden aspect-[3/4]" data-testid="link-category-accessories">
              <img src="/images/category-accessories.png" alt="Accessoires & Toys" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                <h3 className="text-3xl font-serif mb-2">Accessoires & Toys</h3>
                <p className="font-sans font-light text-sm mb-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">Le plaisir redéfini.</p>
                <span className="font-sans uppercase tracking-widest text-xs flex items-center gap-2">
                  Explorer <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>

            {/* Wellness */}
            <Link href="/boutique?category=bien-etre" className="group block relative overflow-hidden aspect-[3/4]" data-testid="link-category-wellness">
              <img src="/images/category-wellness.png" alt="Bien-être intime" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                <h3 className="text-3xl font-serif mb-2">Bien-être intime</h3>
                <p className="font-sans font-light text-sm mb-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">Prenez soin de vous.</p>
                <span className="font-sans uppercase tracking-widest text-xs flex items-center gap-2">
                  Explorer <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif text-foreground">Nos sélections du moment</h2>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex flex-col gap-4">
                  <div className="bg-muted aspect-[3/4] w-full"></div>
                  <div className="bg-muted h-6 w-3/4 mx-auto"></div>
                  <div className="bg-muted h-4 w-1/4 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {featuredProducts.slice(0, 3).map((product, i) => (
                <div key={product.id} className="animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground font-sans">
              Aucun produit sélectionné pour le moment.
            </div>
          )}
          
          <div className="text-center mt-16">
            <Button asChild variant="outline" className="rounded-none border-foreground text-foreground hover:bg-foreground hover:text-background px-10 py-6 font-sans uppercase tracking-widest text-xs">
              <Link href="/boutique" data-testid="button-view-all">Découvrir toute la collection</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Univers Davilla */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="lg:w-1/2 order-2 lg:order-1 space-y-8">
              <h2 className="text-4xl lg:text-5xl font-serif text-foreground">L'univers Davilla</h2>
              
              <div className="space-y-6 font-sans text-foreground/80 leading-relaxed font-light">
                <p>
                  Chez Davilla Rondeur, nous croyons que chaque courbe raconte une histoire et mérite d'être célébrée. Notre atelier est né d'une volonté simple : offrir aux femmes voluptueuses une lingerie et des accessoires intimes qui allient esthétisme absolu, confort sans compromis et sensualité affirmée.
                </p>
                <p>
                  La qualité est au cœur de notre démarche. Chaque pièce est rigoureusement sélectionnée pour la noblesse de ses matières, la précision de ses coupes et sa capacité à sublimer votre silhouette. Nous refusons les standards génériques pour embrasser la diversité des corps avec élégance.
                </p>
                <p>
                  Parce que votre intimité est précieuse, notre engagement de discrétion est total. De la navigation sur notre boutique jusqu'à la réception de votre colis dans un emballage neutre et raffiné, votre expérience Davilla se vit dans la plus stricte confidentialité.
                </p>
              </div>
              
              <div className="pt-4">
                <Button asChild variant="link" className="px-0 text-foreground hover:text-primary font-sans uppercase tracking-widest text-xs">
                  <Link href="/univers" data-testid="link-read-more">Lire notre histoire <ArrowRight className="ml-2 w-4 h-4" /></Link>
                </Button>
              </div>
            </div>
            
            <div className="lg:w-1/2 order-1 lg:order-2 w-full">
              <div className="aspect-[4/5] relative overflow-hidden">
                <img 
                  src="/images/univers.png" 
                  alt="L'univers Davilla" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantees */}
      <section className="py-16 border-y border-border bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 text-center divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="flex flex-col items-center pt-8 sm:pt-0">
              <Lock className="w-8 h-8 mb-4 text-primary" strokeWidth={1} />
              <h4 className="font-serif text-lg mb-2 text-foreground">Livraison discrète</h4>
              <p className="font-sans text-sm text-muted-foreground">Emballage neutre sans mention de la marque</p>
            </div>
            <div className="flex flex-col items-center pt-8 sm:pt-0">
              <HeartHandshake className="w-8 h-8 mb-4 text-primary" strokeWidth={1} />
              <h4 className="font-serif text-lg mb-2 text-foreground">Paiement sécurisé</h4>
              <p className="font-sans text-sm text-muted-foreground">Transactions 100% cryptées et protégées</p>
            </div>
            <div className="flex flex-col items-center pt-8 sm:pt-0">
              <Package className="w-8 h-8 mb-4 text-primary" strokeWidth={1} />
              <h4 className="font-serif text-lg mb-2 text-foreground">Service client</h4>
              <p className="font-sans text-sm text-muted-foreground">À votre écoute en toute bienveillance</p>
            </div>
            <div className="flex flex-col items-center pt-8 sm:pt-0">
              <ArrowLeftRight className="w-8 h-8 mb-4 text-primary" strokeWidth={1} />
              <h4 className="font-serif text-lg mb-2 text-foreground">Retours maîtrisés</h4>
              <p className="font-sans text-sm text-muted-foreground">Processus simple sous 14 jours</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto px-4 lg:px-8 max-w-2xl">
          <h2 className="text-3xl lg:text-4xl font-serif mb-6">Confidences Davilla</h2>
          <p className="font-sans font-light mb-10 opacity-90">
            Inscrivez-vous à notre newsletter pour recevoir nos conseils intimes, nos nouveautés en avant-première et des offres exclusives.
          </p>
          
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-6">
            <Input 
              type="email" 
              placeholder="Votre adresse email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/50 rounded-none h-12 focus-visible:ring-primary-foreground focus-visible:border-primary-foreground font-sans"
              required
              data-testid="input-newsletter-email"
            />
            <Button 
              type="submit" 
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-none h-12 px-8 font-sans uppercase tracking-widest text-xs"
              disabled={subscribe.isPending}
              data-testid="button-newsletter-submit"
            >
              {subscribe.isPending ? "Inscription..." : "S'inscrire"}
            </Button>
          </form>
          <p className="text-[10px] font-sans opacity-60">
            En vous inscrivant, vous acceptez notre politique de confidentialité. Vous pouvez vous désinscrire à tout moment.
          </p>
        </div>
      </section>
    </Layout>
  );
}
