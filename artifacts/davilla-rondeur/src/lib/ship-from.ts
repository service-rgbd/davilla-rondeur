/** Expéditeur affiché sur les bons de préparation / impressions */
export const SHIP_FROM = {
  name: "Davilla Rondeur",
  line1: "27 place des fleurs",
  postalCode: "78955",
  city: "Carrières-sous-Poissy",
  country: "FR",
  phone: "+33 6 03 68 62 94",
  email: "support@davilla-rondeur.fr",
} as const;

export function formatCountry(code: string | null | undefined): string {
  if (!code) return "";
  if (code === "FR") return "France";
  return code;
}
