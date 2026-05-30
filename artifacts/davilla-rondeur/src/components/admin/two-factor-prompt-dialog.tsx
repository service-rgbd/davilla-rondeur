import { Link } from "wouter";
import { ShieldCheck, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAdminGetTwoFactorStatus } from "@workspace/api-client-react";
import { adminRoutes } from "@/lib/admin-routes";
import { dismissTwoFactorPrompt, isTwoFactorPromptDismissed } from "@/lib/admin-session-storage";
import { useState } from "react";

export function TwoFactorPromptDialog() {
  const { data: status, isLoading } = useAdminGetTwoFactorStatus();
  const [dismissedLocally, setDismissedLocally] = useState(isTwoFactorPromptDismissed);

  const shouldShow =
    !isLoading &&
    status &&
    !status.enabled &&
    !dismissedLocally;

  const handleDismiss = () => {
    dismissTwoFactorPrompt();
    setDismissedLocally(true);
  };

  return (
    <Dialog open={shouldShow} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="rounded-none sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-border bg-muted/40">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="font-sans text-left">Renforcez la sécurité</DialogTitle>
                <DialogDescription className="font-sans text-left mt-1">
                  Activez l&apos;authentification à deux facteurs pour protéger l&apos;accès au portail admin.
                </DialogDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-none shrink-0 -mt-1 -mr-2"
              onClick={handleDismiss}
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="font-sans text-sm text-muted-foreground space-y-3">
          <p>
            La double authentification (2FA) ajoute une vérification via application
            (Google Authenticator, Authy…) à chaque connexion.
          </p>
          <p>Vous pourrez l&apos;activer en quelques minutes depuis les paramètres.</p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button type="button" variant="outline" className="rounded-none" onClick={handleDismiss}>
            Plus tard
          </Button>
          <Button type="button" className="rounded-none" asChild onClick={handleDismiss}>
            <Link href={`${adminRoutes.settings}#securite`}>Activer la 2FA</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
