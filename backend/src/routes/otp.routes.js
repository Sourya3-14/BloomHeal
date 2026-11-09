import { Router } from "express";
import { body } from "express-validator";
import { sendOtp, verifyOtp } from "../controllers/otp.controller.js";

const router = Router();

router.post(
  "/send",
  [body("email").isEmail().withMessage("Valid email is required")],
  sendOtp,
);

router.post(
  "/verify",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage("OTP must be 6 digits"),
  ],
  verifyOtp,
);

export default router;
