import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import cartRouter from "./cart";
import checkoutRouter from "./checkout";
import ordersRouter from "./orders";
import newsletterRouter from "./newsletter";
import adminRouter from "./admin";
import mediaRouter from "./media";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mediaRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(cartRouter);
router.use(checkoutRouter);
router.use(ordersRouter);
router.use(newsletterRouter);
router.use(adminRouter);

export default router;
