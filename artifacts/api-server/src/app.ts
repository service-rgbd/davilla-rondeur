import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { handleStripeWebhook } from "./routes/webhooks";
import { getFrontendUrl, parseOriginList } from "./lib/stripe";
import { logger } from "./lib/logger";

function getAllowedOrigins(): string[] {
  const origins = new Set<string>([
    "https://davilla-rondeur.fr",
    "https://www.davilla-rondeur.fr",
    "https://portail.davilla-rondeur.fr",
    "http://localhost:19957",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:19957",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
  ]);

  try {
    origins.add(getFrontendUrl());
  } catch (error) {
    logger.warn({ err: error }, "FRONTEND_URL ignored for CORS — fix env on Render");
  }

  for (const origin of parseOriginList(process.env.ALLOWED_ORIGINS)) {
    origins.add(origin);
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
