import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { setBaseUrl } from "@workspace/api-client-react";
import PortailApp from "./portail-App";
import "./index.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
if (typeof apiBaseUrl === "string" && apiBaseUrl.trim() !== "") {
  setBaseUrl(apiBaseUrl.replace(/\/+$/, ""));
}

registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(<PortailApp />);
