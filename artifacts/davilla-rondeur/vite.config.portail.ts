import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

/** En dev, Vite sert par défaut index.html (boutique) — on redirige / vers portail/index.html */
function portailDevEntry(): Plugin {
  return {
    name: "portail-dev-entry",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const raw = req.url ?? "/";
        const [pathname, search = ""] = raw.split("?");
        if (pathname === "/" || pathname === "/index.html") {
          req.url = `/portail/index.html${search ? `?${search}` : ""}`;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  const basePath = process.env.BASE_PATH ?? "/";
  const rawPort = process.env.PORT ?? "5173";
  const port = Number(rawPort);

  return {
    base: basePath,
    plugins: [portailDevEntry(), react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    envDir: path.resolve(import.meta.dirname),
    root: path.resolve(import.meta.dirname),
    publicDir: path.resolve(import.meta.dirname, "public"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/portail/public"),
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(import.meta.dirname, "portail/index.html"),
      },
    },
    server: {
      port,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      open: "/login",
      fs: {
        strict: true,
        allow: [path.resolve(import.meta.dirname)],
      },
      proxy: {
        "/api": {
          target:
            process.env.API_PROXY_TARGET ??
            process.env.VITE_API_PROXY_TARGET ??
            "https://api.davilla-rondeur.fr",
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
