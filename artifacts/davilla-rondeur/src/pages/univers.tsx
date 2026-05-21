import { Layout } from "@/components/layout/layout";

export default function Univers() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/univers.png" 
            alt="L'univers Davilla" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-serif mb-4">L'Univers Davilla</h1>
          <p className="font-sans uppercase tracking-widest text-sm opacity-90">L'art de célébrer les courbes</p>
        </div>
      </section>

      {/* Manifesto */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl font-serif text-primary mb-8">Notre Manifeste</h2>
          <div className="space-y-6 font-sans text-foreground/80 leading-relaxed font-light text-lg">
            <p>
              Pendant trop longtemps, la volupté a été mise en marge ou habillée sans considération. Davilla Rondeur est née d'un constat et d'une évidence : chaque corps est une œuvre d'art, chaque silhouette mérite la parure la plus noble.
            </p>
            <p>
              Nous ne faisons pas des "grandes tailles". Nous créons pour des femmes. Des femmes souveraines, des femmes sensuelles, des femmes qui s'aiment ou apprennent à le faire.
            </p>
            <p className="text-xl font-serif text-foreground py-4">
              "L'élégance n'est pas une question de taille, c'est une question de posture et de respect de soi."
            </p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="text-center">
              <span className="block text-4xl font-serif text-primary/30 mb-4">01</span>
              <h3 className="text-xl font-serif text-foreground mb-4">La Coupe</h3>
              <p className="font-sans text-muted-foreground font-light leading-relaxed">
                Le maintien ne doit jamais être l'ennemi de la délicatesse. Nos modèles sont structurés pour apporter un soutien irréprochable tout en conservant une allure aérienne. Une ingénierie invisible au service de votre confort.
              </p>
            </div>
            <div className="text-center">
              <span className="block text-4xl font-serif text-primary/30 mb-4">02</span>
              <h3 className="text-xl font-serif text-foreground mb-4">Les Matières</h3>
              <p className="font-sans text-muted-foreground font-light leading-relaxed">
                Dentelles de Calais, satins caressants, tulles brodés et cotons précieux. Nous sélectionnons les étoffes les plus douces, celles qui frôlent la peau avec respect et dont la longévité témoigne de notre exigence.
              </p>
            </div>
            <div className="text-center">
              <span className="block text-4xl font-serif text-primary/30 mb-4">03</span>
              <h3 className="text-xl font-serif text-foreground mb-4">La Discrétion</h3>
              <p className="font-sans text-muted-foreground font-light leading-relaxed">
                L'intimité porte bien son nom. Du traitement de vos données à l'expédition de votre commande dans nos coffrets neutres, nous assurons une confidentialité absolue. Ce qui est à vous reste à vous.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Image break */}
      <section className="h-[50vh] w-full bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 mix-blend-multiply">
          <img src="/images/hero.png" alt="Texture" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <h2 className="text-3xl md:text-5xl font-serif text-primary-foreground max-w-4xl leading-tight">
            Reprenez possession de votre sensualité.
          </h2>
        </div>
      </section>
    </Layout>
  );
}
