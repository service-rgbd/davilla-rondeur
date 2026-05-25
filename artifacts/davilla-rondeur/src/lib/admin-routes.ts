const rawBase = (import.meta.env.VITE_ADMIN_BASE ?? "/admin").replace(/\/+$/, "");

function path(segment: string): string {
  if (!rawBase) return segment;
  return `${rawBase}${segment}`;
}

export const adminRoutes = {
  base: rawBase,
  login: path("/login"),
  home: rawBase || "/",
  orders: path("/orders"),
  products: path("/products"),
  productNew: path("/products/new"),
  productEdit: (id: number | string) => path(`/products/${id}`),
  contacts: path("/contacts"),
  settings: path("/settings"),
  storeUrl: "https://davilla-rondeur.fr",
} as const;
