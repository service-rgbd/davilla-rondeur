import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const fieldClassName =
  "w-full rounded-none bg-transparent border-0 border-b border-foreground/20 py-3 font-sans text-sm focus:outline-none focus:border-foreground transition-colors resize-y min-h-[160px]";

export default function Contact() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setMessage("");
      toast({
        title: "Message envoyé",
        description: "Notre équipe vous répondra dans les plus brefs délais.",
      });
    }, 1000);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 lg:px-8 py-16 sm:py-20 max-w-3xl">
        <div className="text-center mb-14 sm:mb-16">
          <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-4">
            Davilla Rondeur
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-sans font-bold tracking-tight text-foreground mb-6">
            Contactez l&apos;Atelier
          </h1>
          <p className="font-sans text-sm sm:text-base text-muted-foreground leading-relaxed">
            Une question sur une taille, un produit ou une commande ? Notre équipe vous répond en toute
            discrétion et bienveillance.
          </p>
        </div>

        <div className="space-y-10 sm:space-y-12 font-sans">
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="flex gap-4">
              <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Email</p>
                <a
                  href="mailto:support@davilla-rondeur.fr"
                  className="text-sm sm:text-base hover:text-primary transition-colors break-all"
                >
                  support@davilla-rondeur.fr
                </a>
              </div>
            </div>

            <div className="flex gap-4">
              <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Téléphone</p>
                <a href="tel:+33603686294" className="text-sm sm:text-base hover:text-primary transition-colors">
                  +33 6 03 68 62 94
                </a>
              </div>
            </div>

            <div className="flex gap-4 sm:col-span-2">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Adresse</p>
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                  27 place des fleurs
                  <br />
                  Carrière sous Poissy 78955
                </p>
              </div>
            </div>

            <div className="flex gap-4 sm:col-span-2">
              <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Horaires</p>
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                  Du lundi au vendredi, de 10h00 à 18h00
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-10 sm:pt-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label
                  htmlFor="message"
                  className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground block mb-4"
                >
                  Votre message
                </label>
                <textarea
                  id="message"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={fieldClassName}
                  placeholder="Décrivez votre demande..."
                />
              </div>

              <Button
                type="submit"
                className="w-full sm:w-auto px-10 bg-foreground text-background hover:opacity-90 rounded-none h-12 font-sans text-[11px] uppercase tracking-[0.3em]"
                disabled={isSubmitting || !message.trim()}
                data-testid="button-submit-contact"
              >
                {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
              </Button>
            </form>
          </div>

          <p className="text-center font-sans text-sm text-muted-foreground italic border-t border-border pt-10">
            Davilla Rondeur accompagne les femmes dans leur quête de confiance et de beauté intime, sans aucun
            compromis.
          </p>
        </div>
      </div>
    </Layout>
  );
}
