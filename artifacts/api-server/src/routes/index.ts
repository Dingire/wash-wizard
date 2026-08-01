import { Router, type IRouter } from "express";
import healthRouter from "./health";
import servicesRouter from "./services";
import transactionsRouter from "./transactions";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(servicesRouter);
router.use(transactionsRouter);
router.use(reportsRouter);

export default router;
