import express from "express";
import crypto from "crypto";
import oauth2Client, { GOOGLE_SCOPES } from "../config/google.js";
import DoctorProfile from "../models/DoctorProfile.js";
import { encrypt } from "../utils/encryption.js";
import { authRequired } from "../middlewares/auth.js";
import { restrictRole } from "../middlewares/restrict.js";

const router = express.Router();

function createAuthorizationUrl(req) {
  const state = crypto.randomBytes(32).toString("hex");

  req.session.googleOAuthState = state;
  req.session.googleDoctorUserId = req.user.id;

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
    include_granted_scopes: true,
    state,
  });
}

router.get("/connect", authRequired, restrictRole(["doctor"]), (req, res) => {
  res.redirect(createAuthorizationUrl(req));
});

router.post("/connect", authRequired, restrictRole(["doctor"]), (req, res) => {
  res.json({ url: createAuthorizationUrl(req) });
});

router.get("/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (!state || state !== req.session.googleOAuthState) {
      return res.status(403).send("Invalid OAuth state");
    }

    const doctorUserId = req.session.googleDoctorUserId;
    delete req.session.googleOAuthState;
    delete req.session.googleDoctorUserId;

    if (error) {
      return res.status(400).send("Google authorization denied");
    }

    if (!doctorUserId || !code) {
      return res.status(400).send("Invalid OAuth callback");
    }

    const { tokens } = await oauth2Client.getToken(code);
    const doctor = await DoctorProfile.findOne({
      user: doctorUserId,
    }).select("+googleRefreshToken");

    if (!doctor) {
      return res.status(404).send("Doctor not found");
    }

    if (tokens.refresh_token) {
      doctor.googleRefreshToken = encrypt(tokens.refresh_token);
    }

    if (!doctor.googleRefreshToken) {
      return res.status(400).send("Google did not provide a refresh token");
    }

    doctor.googleCalendarConnected = true;
    await doctor.save();

    const frontendUrl =
      process.env.CLIENT_ORIGIN ||
      "http://localhost:5173";
    return res.redirect(`${frontendUrl}/scheduled-appointments?google=connected`);
  } catch (error) {
    console.error("Google OAuth error:", error);
    return res.status(500).send("Google connection failed");
  }
});

export default router;
