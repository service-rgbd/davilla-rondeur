import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Message envoyé",
        description: "Notre équipe vous répondra dans les plus brefs délais.",
      });
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 lg:px-8 py-20 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-6">Contactez l'Atelier</h1>
          <p className="font-sans text-muted-foreground max-w-2xl mx-auto">
            Une question sur une taille ? Besoin d'un conseil ? Notre équipe est à votre écoute en toute discrétion et bienveillance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="font-sans text-sm uppercase tracking-widest text-foreground">Nom complet</label>
                <Input 
                  id="name" 
                  required 
                  className="rounded-none border-border bg-transparent h-12 focus-visible:ring-primary focus-visible:border-primary" 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="font-sans text-sm uppercase tracking-widest text-foreground">Email</label>
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  className="rounded-none border-border bg-transparent h-12 focus-visible:ring-primary focus-visible:border-primary" 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="subject" className="font-sans text-sm uppercase tracking-widest text-foreground">Sujet</label>
                <Input 
                  id="subject" 
                  required 
                  className="rounded-none border-border bg-transparent h-12 focus-visible:ring-primary focus-visible:border-primary" 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="font-sans text-sm uppercase tracking-widest text-foreground">Message</label>
                <Textarea 
                  id="message" 
                  required 
                  className="rounded-none border-border bg-transparent min-h-[150px] resize-y focus-visible:ring-primary focus-visible:border-primary" 
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-foreground text-background hover:bg-primary hover:text-primary-foreground rounded-none h-14 font-sans uppercase tracking-widest text-sm mt-4"
                disabled={isSubmitting}
                data-testid="button-submit-contact"
              >
                {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
              </Button>
            </form>
          </div>

          {/* Info */}
          <div className="bg-muted/30 p-10 flex flex-col justify-center">
            <h3 className="text-2xl font-serif text-foreground mb-8">Informations</h3>
            
            <div className="space-y-8 font-sans">
              <div>
                <h4 className="text-sm uppercase tracking-widest text-primary mb-2">Service Client</h4>
                <p className="text-muted-foreground font-light">
                  bonjour@davilla-rondeur.fr<br />
                  +33 (0)1 42 00 00 00
                </p>
                <p className="text-sm text-muted-foreground font-light mt-2">
                  Du lundi au vendredi<br />
                  De 10h00 à 18h00
                </p>
              </div>

              <div>
                <h4 className="text-sm uppercase tracking-widest text-primary mb-2">Presse & Partenariats</h4>
                <p className="text-muted-foreground font-light">
                  presse@davilla-rondeur.fr
                </p>
              </div>

              <div className="pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground font-light italic">
                  "Davilla Rondeur accompagne les femmes dans leur quête de confiance et de beauté intime, sans aucun compromis."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
