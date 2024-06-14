import { Router } from "express";
import { ActivityController } from "../controllers/activity.controller";
import { payloadValidator } from "../middlewares/payload_validator.middleware";
import { Activity } from "../constants/payload_schema";

const router = Router();
const controller = new ActivityController();

router.post(
  "/start",
  payloadValidator(Activity.start),
  controller.start.bind(controller),
);

router.post(
  "/stop",
  payloadValidator(Activity.stop),
  controller.stop.bind(controller),
);

router.get("/elapsed/:activityName", controller.elapsed.bind(controller));

router.get("/results", controller.results.bind(controller));

export default router;
