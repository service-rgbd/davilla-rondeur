import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminEmail } from "@/lib/admin-auth";
import { Globe, Mail, Server, Shield } from "lucide-react";

export default function AdminSettings() {
  const email = getAdminEmail();

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-sans font-bold tracking-tight">Paramètres</h1>
        <p className="font-sans text-sm text-muted-foreground mt-1">
          Configuration de l&apos;environnement et accès administrateur
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-none border-border shadow-none">
          <CardHeader>
            <CardTitle className="font-sans text-sm uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Compte administrateur
            </CardTitle>
          </CardHeader>
          <CardContent className="font-sans text-sm space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Email connecté</p>
              <p className="font-medium">{email ?? "—"}</p>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Les identifiants admin sont configurés via les variables{" "}
              <code className="text-foreground">ADMIN_EMAIL</code> et{" "}
              <code className="text-foreground">ADMIN_PASSWORD</code> sur Render.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border shadow-none">
          <CardHeader>
            <CardTitle className="font-sans text-sm uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-4 h-4" />
              URLs de production
            </CardTitle>
          </CardHeader>
          <CardContent className="font-sans text-sm space-y-3">
            <div className="flex justify-between gap-4 border-b border-border pb-3">
              <span className="text-muted-foreground">Boutique</span>
              <a
                href="https://davilla-rondeur.fr"
                target="_blank"
                rel="noreferrer"
                className="font-medium hover:underline text-right"
              >
                davilla-rondeur.fr
              </a>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-3">
              <span className="text-muted-foreground">API</span>
              <span className="font-medium text-right">api.davilla-rondeur.fr</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Médias R2</span>
              <span className="font-medium text-right">media.davilla-rondeur.fr</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-sans text-sm uppercase tracking-widest flex items-center gap-2">
              <Server className="w-4 h-4" />
              Services connectés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans text-sm">
              {[
                { name: "Stripe", desc: "Paiements & webhooks" },
                { name: "Resend", desc: "Emails de confirmation" },
                { name: "Neon", desc: "Base de données" },
                { name: "Cloudflare R2", desc: "Images produits" },
              ].map((service) => (
                <div key={service.name} className="border border-border p-4">
                  <p className="font-semibold">{service.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{service.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-sans text-sm uppercase tracking-widest flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Emails transactionnels
            </CardTitle>
          </CardHeader>
          <CardContent className="font-sans text-sm text-muted-foreground">
            <p>
              Les confirmations de commande sont envoyées depuis{" "}
              <span className="text-foreground font-medium">noreply@davilla-rondeur.fr</span> via Resend
              après paiement Stripe confirmé.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
