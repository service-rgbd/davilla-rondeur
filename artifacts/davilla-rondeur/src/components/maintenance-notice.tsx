import { Link } from "wouter";
import { Mail, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

type MaintenanceNoticeProps = {
  message: string;
  supportEmail: string;
  backHref?: string;
  backLabel?: string;
  compact?: boolean;
};

export function MaintenanceNotice({
  message,
  supportEmail,
  backHref = "/boutique",
  backLabel = "Retour à la boutique",
  compact = false,
}: MaintenanceNoticeProps) {
  return (
    <div
      className={
        compact
          ? "border border-border bg-muted/30 p-8 text-center space-y-5"
          : "min-h-[50vh] flex flex-col items-center justify-center text-center px-6 py-16"
      }
    >
      {!compact ? (
        <div className="mb-6">
          <BrandLogo className="h-10 w-auto mx-auto opacity-90" />
        </div>
      ) : null}

      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted border border-border mb-2">
        <Wrench className="w-6 h-6 text-muted-foreground" />
      </div>

      <div className="max-w-md space-y-3">
        <h2 className="font-sans text-2xl font-semibold tracking-tight text-foreground">
          Site en maintenance
        </h2>
        <p className="font-sans text-sm text-muted-foreground leading-relaxed">{message}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button asChild variant="outline" className="rounded-none font-sans uppercase tracking-widest text-xs h-11">
          <a href={`mailto:${supportEmail}`}>
            <Mail className="w-4 h-4 mr-2" />
            Contacter le support
          </a>
        </Button>
        {backHref ? (
          backHref.startsWith("http") ? (
            <Button asChild className="rounded-none font-sans uppercase tracking-widest text-xs h-11">
              <a href={backHref}>{backLabel}</a>
            </Button>
          ) : (
            <Button asChild className="rounded-none font-sans uppercase tracking-widest text-xs h-11">
              <Link href={backHref}>{backLabel}</Link>
            </Button>
          )
        ) : null}
      </div>
    </div>
  );
}
