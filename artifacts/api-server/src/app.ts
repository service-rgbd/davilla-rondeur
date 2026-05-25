import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { handleStripeWebhook } from "./routes/webhooks";
import { getFrontendUrl } from "./lib/stripe";
import { logger } from "./lib/logger";

function getAllowedOrigins(): string[] {
  const frontendUrl = getFrontendUrl().replace(/\/+$/, "");
  const origins = new Set<string>([
    frontendUrl,
    "https://davilla-rondeur.fr",
    "https://www.davilla-rondeur.fr",
    "http://localhost:19957",
    "http://localhost:5173",
    "http://127.0.0.1:19957",
    "http://127.0.0.1:5173",
  ]);

  const extra = process.env.ALLOWED_ORIGINS;
  if (extra) {
    for (const origin of extra.split(",")) {
      const trimmed = origin.trim().replace(/\/+$/, "");
      if (trimmed) origins.add(trimmed);
    }
  }

  return [...origins];
}

const app: Express = express();

app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || getAllowedOrigins().includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
