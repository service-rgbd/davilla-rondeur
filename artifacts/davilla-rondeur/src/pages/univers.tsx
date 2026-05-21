import { Layout } from "@/components/layout/layout";
import { HERO_IMAGE, CATEGORY_IMAGES } from "@/lib/product-images";

export default function Univers() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={HERO_IMAGE} alt="L'univers Davilla" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-sans font-bold mb-4">L'Univers Davilla</h1>
          <p className="font-sans uppercase tracking-widest text-sm opacity-90">La santé au naturel, pensée pour vous</p>
        </div>
      </section>

      {/* Manifesto */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl font-sans font-semibold text-primary mb-8">Notre Vision</h2>
          <div className="space-y-6 font-sans text-foreground/80 leading-relaxed font-light text-lg">
            <p>
              Davilla Rondeur est née d'une conviction profonde : chaque femme mérite des produits naturels formulés avec soin, adaptés à son corps et à ses ambitions. Nous avons créé une gamme de sirops et compléments alimentaires qui célèbrent la rondeur et soutiennent la vitalité féminine.
            </p>
            <p>
              Notre démarche est simple, honnête et engagée. Pas de promesses irréalistes — seulement des formules naturelles éprouvées, des ingrédients sélectionnés avec rigueur, et un accompagnement bienveillant à chaque étape de votre cure.
            </p>
            <p className="text-xl font-sans font-medium text-foreground py-4 italic">
              "La rondeur est une grâce. Davilla Rondeur, c'est prendre soin de cette grâce naturellement."
            </p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="text-center">
              <span className="block text-4xl font-sans font-bold text-primary/20 mb-4">01</span>
              <h3 className="text-xl font-sans font-semibold text-foreground mb-4">Les Ingrédients</h3>
              <p className="font-sans text-muted-foreground font-light leading-relaxed">
                Menthe fraîche, miel pur, plantes sélectionnées. Chaque ingrédient est choisi pour sa qualité, sa provenance et son efficacité naturelle. Aucun additif chimique, aucun conservateur artificiel.
              </p>
            </div>
            <div className="text-center">
              <span className="block text-4xl font-sans font-bold text-primary/20 mb-4">02</span>
              <h3 className="text-xl font-sans font-semibold text-foreground mb-4">Les Formules</h3>
              <p className="font-sans text-muted-foreground font-light leading-relaxed">
                Nos sirops et gélules sont le fruit d'une formulation rigoureuse. Chaque produit est dosé avec précision pour vous apporter des résultats visibles, progressifs et durables, en respectant votre corps.
              </p>
            </div>
            <div className="text-center">
              <span className="block text-4xl font-sans font-bold text-primary/20 mb-4">03</span>
              <h3 className="text-xl font-sans font-semibold text-foreground mb-4">La Discrétion</h3>
              <p className="font-sans text-muted-foreground font-light leading-relaxed">
                De la commande à la livraison, votre vie privée est notre priorité. Colis neutres, facturation discrète, communication confidentielle. Ce que vous commandez reste entre vous et nous.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Image break */}
      <section className="h-[50vh] w-full bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-25 mix-blend-multiply">
          <img src={CATEGORY_IMAGES["sirops-naturels"]} alt="Produits Davilla" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <h2 className="text-3xl md:text-5xl font-sans font-semibold text-primary-foreground max-w-4xl leading-tight">
            Prenez soin de votre corps. Naturellement.
          </h2>
        </div>
      </section>
    </Layout>
  );
}
