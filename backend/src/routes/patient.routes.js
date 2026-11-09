import express from "express";
import {
  upsertPatientProfile,
  getMyPatientProfile,
  getMeetingAccess,
} from "../controllers/patient.controller.js";
import { authRequired } from "../middlewares/auth.js";

const router = express.Router();

// Create or update profile
router.post("/profile", authRequired, upsertPatientProfile);

// Get my profile
router.get("/profile", authRequired, getMyPatientProfile);

router.get("/:id/meeting-access", authRequired, getMeetingAccess);

export default router;
