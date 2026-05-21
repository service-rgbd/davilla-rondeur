import { Layout } from "@/components/layout/layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "wouter";

export default function FAQ() {
  return (
    <Layout>
      <div className="container mx-auto px-4 lg:px-8 py-20 max-w-3xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-6">Foire aux Questions</h1>
          <p className="font-sans text-muted-foreground">
            Nous répondons ici à vos interrogations les plus fréquentes. Pour toute autre demande, n'hésitez pas à nous <Link href="/contact" className="underline underline-offset-4 hover:text-primary">contacter</Link>.
          </p>
        </div>

        <div className="space-y-12">
          
          <div>
            <h2 className="text-xl font-sans uppercase tracking-widest text-primary mb-6">Expédition & Discrétion</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="q1" className="border-border">
                <AccordionTrigger className="font-sans text-left text-base py-5 hover:no-underline">Les colis sont-ils vraiment discrets ?</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground font-light leading-relaxed pb-5">
                  Absolument. La confidentialité est l'un des piliers de Davilla Rondeur. Toutes nos expéditions sont réalisées dans des cartons bruts, sans aucune mention de la marque "Davilla Rondeur" ni référence à la lingerie ou aux accessoires intimes. L'expéditeur mentionné est une société de logistique neutre.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2" className="border-border">
                <AccordionTrigger className="font-sans text-left text-base py-5 hover:no-underline">Quels sont les délais de livraison ?</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground font-light leading-relaxed pb-5">
                  Pour la France métropolitaine, les commandes passées avant midi sont expédiées le jour même. La livraison standard prend 48h à 72h ouvrées. La livraison express garantit une réception sous 24h ouvrées.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div>
            <h2 className="text-xl font-sans uppercase tracking-widest text-primary mb-6">Tailles & Produits</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="q3" className="border-border">
                <AccordionTrigger className="font-sans text-left text-base py-5 hover:no-underline">Jusqu'à quelles tailles allez-vous ?</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground font-light leading-relaxed pb-5">
                  Nous célébrons toutes les courbes. Nos soutiens-gorge vont du bonnet C au bonnet K, et nos bas et bodies du 40 au 56. Certains modèles spécifiques s'adaptent même au-delà grâce à des matières intelligentes et extensibles.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4" className="border-border">
                <AccordionTrigger className="font-sans text-left text-base py-5 hover:no-underline">Comment être sûre de ma taille ?</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground font-light leading-relaxed pb-5">
                  Chaque page produit propose un guide des tailles détaillé. Si vous avez un doute, notre service client est composé de conseillères expertes en corseterie. Vous pouvez nous écrire via le formulaire de contact, nous vous guiderons avec bienveillance.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div>
            <h2 className="text-xl font-sans uppercase tracking-widest text-primary mb-6">Retours & Remboursements</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="q5" className="border-border">
                <AccordionTrigger className="font-sans text-left text-base py-5 hover:no-underline">Puis-je retourner ma commande ?</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground font-light leading-relaxed pb-5">
                  Vous disposez de 14 jours après réception pour nous retourner un article. Pour des raisons d'hygiène, la lingerie (notamment les bas) doit être retournée non portée, dans son emballage d'origine, avec toutes les étiquettes attachées. Les "Toys" et accessoires intimes ne peuvent être retournés s'ils ont été descellés.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

        </div>
      </div>
    </Layout>
  );
}
