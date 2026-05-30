import { Bell, BellOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminPush } from "@/hooks/use-admin-push";
import { useToast } from "@/hooks/use-toast";

export function PushNotificationsSection() {
  const { toast } = useToast();
  const {
    supported,
    iosNeedsPwa,
    configured,
    subscribed,
    statusLoading,
    enable,
    disable,
    sendTest,
    isEnabling,
    isDisabling,
    isTesting,
  } = useAdminPush();

  if (!supported) {
    return (
      <p className="font-sans text-sm text-muted-foreground">
        Non supporté sur ce navigateur.
      </p>
    );
  }

  if (statusLoading) {
    return <div className="h-10 animate-pulse bg-muted border border-border" />;
  }

  if (!configured) {
    return (
      <p className="font-sans text-sm text-muted-foreground">
        Non configuré sur le serveur.
      </p>
    );
  }

  const handleEnable = () => {
    void enable()
      .then(() => {
        toast({ title: "Notifications activées" });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Impossible d'activer les notifications";
        toast({ title: "Erreur", description: message, variant: "destructive" });
      });
  };

  const handleDisable = () => {
    void disable()
      .then(() => {
        toast({ title: "Notifications désactivées" });
      })
      .catch(() => {
        toast({ title: "Erreur", description: "Impossible de désactiver les notifications", variant: "destructive" });
      });
  };

  const handleTest = () => {
    void sendTest()
      .then((result) => {
        toast({
          title: result.sent > 0 ? "Notification test envoyée" : "Notification non reçue",
          description: result.message,
          variant: result.sent > 0 ? "default" : "destructive",
        });
      })
      .catch((error: unknown) => {
        const apiError = error as { data?: { error?: string }; message?: string };
        const message =
          apiError.data?.error ??
          (error instanceof Error ? error.message : "Impossible d'envoyer le test");
        toast({ title: "Échec du test", description: message, variant: "destructive" });
      });
  };

  const busy = isEnabling || isDisabling || isTesting;

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3">
      {!subscribed ? (
        <Button
          type="button"
          disabled={busy || iosNeedsPwa}
          onClick={handleEnable}
          className="rounded-none font-sans uppercase tracking-widest text-xs"
        >
          <Bell className="h-4 w-4 mr-2" />
          {isEnabling ? "Activation..." : "Activer les notifications"}
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={handleDisable}
          className="rounded-none font-sans uppercase tracking-widest text-xs"
        >
          <BellOff className="h-4 w-4 mr-2" />
          {isDisabling ? "Désactivation..." : "Désactiver"}
        </Button>
      )}

      <Button
        type="button"
        variant={subscribed ? "default" : "outline"}
        disabled={busy || iosNeedsPwa}
        onClick={handleTest}
        className="rounded-none font-sans uppercase tracking-widest text-xs"
      >
        <Send className="h-4 w-4 mr-2" />
        {isTesting ? "Envoi..." : "Tester la notification"}
      </Button>
    </div>
  );
}
