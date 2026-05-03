import { Router, type IRouter } from "express";
import healthRouter from "./health";
import providersRouter from "./providers";
import promptsRouter from "./prompts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(providersRouter);
router.use(promptsRouter);

export default router;
