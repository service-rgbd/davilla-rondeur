import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const projectRoot = path.resolve(import.meta.dirname);

/** En dev, toutes les routes admin (/login, /orders, …) servent portail/index.html */
function portailDevSpaFallback(): Plugin {
  return {
    name: "portail-dev-spa-fallback",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const raw = req.url ?? "/";
        const [pathname, search = ""] = raw.split("?");

        if (
          pathname.startsWith("/@") ||
          pathname.startsWith("/__") ||
          pathname.startsWith("/api") ||
          pathname.startsWith("/node_modules") ||
          pathname === "/portail/index.html"
        ) {
          next();
          return;
        }

        const lastSegment = pathname.split("/").pop() ?? "";
        if (lastSegment.includes(".")) {
          next();
          return;
        }

        req.url = `/portail/index.html${search ? `?${search}` : ""}`;
        next();
      });
    },
  };
}

export default defineConfig(() => {
  const basePath = process.env.BASE_PATH ?? "/";
  const rawPort = process.env.PORT ?? "5174";
  const port = Number(rawPort);

  return {
    appType: "mpa",
    base: basePath,
    plugins: [portailDevSpaFallback(), react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(projectRoot, "src"),
        "@assets": path.resolve(projectRoot, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    envDir: projectRoot,
    root: projectRoot,
    publicDir: path.resolve(projectRoot, "public"),
    build: {
      outDir: path.resolve(projectRoot, "dist/portail/public"),
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(projectRoot, "portail/index.html"),
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
        allow: [projectRoot],
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
