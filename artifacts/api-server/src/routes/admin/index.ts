import { Router, type IRouter } from "express";
import adminAuthRouter from "./auth";
import adminProductsRouter from "./products";
import adminUploadsRouter from "./uploads";

const router: IRouter = Router();

router.use(adminAuthRouter);
router.use(adminProductsRouter);
router.use(adminUploadsRouter);

export default router;
