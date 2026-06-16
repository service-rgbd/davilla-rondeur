import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ command }) => {
  const basePath = process.env.BASE_PATH ?? "/";
  const rawPort = process.env.PORT ?? "5173";
  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  return {
    appType: "spa",
    base: basePath,
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      entries: [path.resolve(import.meta.dirname, "index.html")],
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server:
      command === "serve"
        ? {
            port,
            strictPort: true,
            host: "0.0.0.0",
            allowedHosts: true,
            fs: {
              strict: true,
              deny: [path.resolve(import.meta.dirname, "portail")],
            },
            proxy: {
              "/api": {
                target:
                  process.env.VITE_API_BASE_URL?.trim() ||
                  `http://localhost:${process.env.API_PORT ?? "8080"}`,
                changeOrigin: true,
                secure: true,
              },
            },
          }
        : undefined,
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
