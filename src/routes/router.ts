import { Router } from "express";
import authRoutes from "./auth.routes";
import activityRoutes from "./activity.routes";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use("/auth", authRoutes);
router.use("/activity", authMiddleware, activityRoutes);

export default router;
