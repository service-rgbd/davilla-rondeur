import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ command }) => {
  const basePath = process.env.BASE_PATH ?? "/";
  const rawPort = process.env.PORT ?? "5173";
  const port = Number(rawPort);

  return {
    base: basePath,
    plugins: [react(), tailwindcss()],
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
    server:
      command === "serve"
        ? {
            port,
            strictPort: true,
            host: "0.0.0.0",
            allowedHosts: true,
            fs: {
              strict: true,
              allow: [path.resolve(import.meta.dirname)],
            },
            proxy: {
              "/api": {
                target: `http://localhost:${process.env.API_PORT ?? "8080"}`,
                changeOrigin: true,
              },
            },
          }
        : undefined,
  };
});
