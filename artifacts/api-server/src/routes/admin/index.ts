import { Router, type IRouter } from "express";
import adminAuthRouter from "./auth";
import adminProductsRouter from "./products";
import adminUploadsRouter from "./uploads";
import adminDashboardRouter from "./dashboard";
import adminOrdersRouter from "./orders";
import adminNewsletterRouter from "./newsletter";
import adminCustomersRouter from "./customers";
import adminPushRouter from "./push";

const router: IRouter = Router();

router.use(adminAuthRouter);
router.use(adminProductsRouter);
router.use(adminUploadsRouter);
router.use(adminDashboardRouter);
router.use(adminOrdersRouter);
router.use(adminNewsletterRouter);
router.use(adminCustomersRouter);
router.use(adminPushRouter);

export default router;
