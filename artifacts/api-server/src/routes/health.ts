import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { getMaintenanceStatusPayload } from "../lib/maintenance";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/maintenance", (_req, res) => {
  res.json(getMaintenanceStatusPayload());
});

export default router;
