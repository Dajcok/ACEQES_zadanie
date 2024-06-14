import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { payloadValidator } from "../middlewares/payload_validator.middleware";
import { Auth } from "../constants/payload_schema";

const router = Router();
const controller = new AuthController();

router.post(
  "/login",
  payloadValidator(Auth.login),
  controller.login.bind(controller),
);

export default router;
