import { useState } from "react";
import {
  useAdminChangePassword,
  useAdminDisableTwoFactor,
  useAdminEnableTwoFactor,
  useAdminGetTwoFactorStatus,
  useAdminSetupTwoFactor,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { getAdminEmail } from "@/lib/admin-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const fieldClassName =
  "w-full bg-transparent border-0 border-b border-foreground/20 py-3 font-sans text-sm focus:outline-none focus:border-foreground transition-colors";

export default function AdminSettings() {
  const email = getAdminEmail();
  const { toast } = useToast();
  const changePassword = useAdminChangePassword();
  const { data: twoFactorStatus, refetch: refetchTwoFactor } = useAdminGetTwoFactorStatus();
  const setupTwoFactor = useAdminSetupTwoFactor();
  const enableTwoFactor = useAdminEnableTwoFactor();
  const disableTwoFactor = useAdminDisableTwoFactor();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupData, setSetupData] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null);
  const [enableCode, setEnableCode] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    changePassword.mutate(
      { data: { currentPassword, newPassword, confirmPassword } },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          toast({ title: "Mot de passe mis à jour" });
        },
        onError: (error) => {
          const message =
            error.data && typeof error.data === "object" && "error" in error.data
              ? String((error.data as { error: string }).error)
              : "Impossible de mettre à jour le mot de passe";
          toast({ title: "Erreur", description: message, variant: "destructive" });
        },
      },
    );
  };

  const handleSetupTwoFactor = () => {
    setupTwoFactor.mutate(undefined, {
      onSuccess: (data) => {
        setSetupData({ qrCodeDataUrl: data.qrCodeDataUrl, secret: data.secret });
        setEnableCode("");
        toast({
          title: "Scannez le QR code",
          description: "Utilisez Google Authenticator, Authy ou une application compatible.",
        });
      },
      onError: (error) => {
        const message =
          error.data && typeof error.data === "object" && "error" in error.data
            ? String((error.data as { error: string }).error)
            : "Impossible de préparer la 2FA";
        toast({ title: "Erreur", description: message, variant: "destructive" });
      },
    });
  };

  const handleEnableTwoFactor = (e: React.FormEvent) => {
    e.preventDefault();
    enableTwoFactor.mutate(
      { data: { code: enableCode.trim() } },
      {
        onSuccess: () => {
          setSetupData(null);
          setEnableCode("");
          void refetchTwoFactor();
          toast({ title: "Double authentification activée" });
        },
        onError: (error) => {
          const message =
            error.data && typeof error.data === "object" && "error" in error.data
              ? String((error.data as { error: string }).error)
              : "Code invalide";
          toast({ title: "Erreur", description: message, variant: "destructive" });
        },
      },
    );
  };

  const handleDisableTwoFactor = (e: React.FormEvent) => {
    e.preventDefault();
    disableTwoFactor.mutate(
      { data: { code: disableCode.trim() } },
      {
        onSuccess: () => {
          setDisableCode("");
          void refetchTwoFactor();
          toast({ title: "Double authentification désactivée" });
        },
        onError: (error) => {
          const message =
            error.data && typeof error.data === "object" && "error" in error.data
              ? String((error.data as { error: string }).error)
              : "Code invalide";
          toast({ title: "Erreur", description: message, variant: "destructive" });
        },
      },
    );
  };

  return (
    <AdminLayout>
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight">Paramètres</h1>
        <p className="font-sans text-sm text-muted-foreground mt-1">
          Gérez la sécurité de votre accès administrateur
        </p>
      </div>

      <div className="max-w-xl space-y-12">
        <section>
          <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
            Compte
          </p>
          <p className="font-sans text-sm break-all">{email ?? "—"}</p>
        </section>

        <section className="border-t border-border pt-10">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-widest mb-2">
            Double authentification (2FA)
          </h2>
          <p className="font-sans text-sm text-muted-foreground mb-6">
            Protège votre accès avec un code temporaire depuis une application d&apos;authentification.
          </p>

          {twoFactorStatus?.enabled ? (
            <form onSubmit={handleDisableTwoFactor} className="space-y-6">
              <p className="font-sans text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3">
                La double authentification est active.
              </p>
              <div>
                <label
                  htmlFor="disable-2fa-code"
                  className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground block mb-3"
                >
                  Code pour désactiver
                </label>
                <input
                  id="disable-2fa-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={`${fieldClassName} tracking-[0.35em] text-center`}
                  placeholder="000000"
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                disabled={disableTwoFactor.isPending || disableCode.length !== 6}
                className="rounded-none font-sans uppercase tracking-widest text-xs"
              >
                {disableTwoFactor.isPending ? "Désactivation..." : "Désactiver la 2FA"}
              </Button>
            </form>
          ) : setupData ? (
            <form onSubmit={handleEnableTwoFactor} className="space-y-6">
              <div className="border border-border p-4 inline-block bg-white">
                <img src={setupData.qrCodeDataUrl} alt="QR code 2FA" className="w-48 h-48" />
              </div>
              <p className="font-sans text-xs text-muted-foreground break-all">
                Clé manuelle : {setupData.secret}
              </p>
              <div>
                <label
                  htmlFor="enable-2fa-code"
                  className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground block mb-3"
                >
                  Code de vérification
                </label>
                <input
                  id="enable-2fa-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={enableCode}
                  onChange={(e) => setEnableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={`${fieldClassName} tracking-[0.35em] text-center`}
                  placeholder="000000"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  disabled={enableTwoFactor.isPending || enableCode.length !== 6}
                  className="rounded-none font-sans uppercase tracking-widest text-xs"
                >
                  {enableTwoFactor.isPending ? "Activation..." : "Activer la 2FA"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSetupData(null)}
                  className="rounded-none font-sans uppercase tracking-widest text-xs"
                >
                  Annuler
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              onClick={handleSetupTwoFactor}
              disabled={setupTwoFactor.isPending}
              className="rounded-none font-sans uppercase tracking-widest text-xs"
            >
              {setupTwoFactor.isPending ? "Préparation..." : "Configurer la 2FA"}
            </Button>
          )}
        </section>

        <section className="border-t border-border pt-10">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-widest mb-6">
            Mot de passe
          </h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-8">
            <div>
              <label
                htmlFor="current-password"
                className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground block mb-3"
              >
                Mot de passe actuel
              </label>
              <input
                id="current-password"
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={fieldClassName}
              />
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground block mb-3"
              >
                Nouveau mot de passe
              </label>
              <input
                id="new-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={fieldClassName}
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground block mb-3"
              >
                Confirmer le nouveau mot de passe
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={fieldClassName}
              />
            </div>

            <button
              type="submit"
              disabled={changePassword.isPending}
              className="w-full sm:w-auto px-8 bg-foreground text-background py-3 font-sans text-[11px] uppercase tracking-[0.3em] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {changePassword.isPending ? "Enregistrement..." : "Mettre à jour le mot de passe"}
            </button>
          </form>
        </section>
      </div>
    </AdminLayout>
  );
}
