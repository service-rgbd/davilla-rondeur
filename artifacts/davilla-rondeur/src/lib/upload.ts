import { getAdminToken } from "@/lib/admin-auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (typeof base === "string" && base.trim() !== "") {
    return base.replace(/\/+$/, "");
  }
  return "";
}

/**
 * Upload via l'API (pas d'appel direct au bucket R2).
 * Les URLs publiques utilisent R2_PUBLIC_URL (ex. media.davilla-rondeur.fr).
 */
export async function uploadProductImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Type de fichier non autorisé (jpeg, png, webp, gif)");
  }

  const token = getAdminToken();
  if (!token) {
    throw new Error("Session admin expirée. Reconnectez-vous.");
  }

  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${getApiBaseUrl()}/api/admin/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const data = (await response.json().catch(() => null)) as
    | { publicUrl?: string; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(data?.error ?? "Échec de l'upload vers R2");
  }

  if (!data?.publicUrl) {
    throw new Error("Réponse upload invalide");
  }

  return data.publicUrl;
}
