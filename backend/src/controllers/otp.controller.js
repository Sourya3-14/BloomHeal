import { randomInt, createHash } from "crypto";
// import resend from "../config/resend_mail.js";
import { sendOtpEmail } from "../services/notification_service.js";
import redis from "../config/redis.js";
import User from "../models/User.js";

const OTP_TTL = 300;
const VERIFIED_TTL = 600;

const getOtpKey = (email) => `otp:${email}`;
const getVerifiedKey = (email) => `otp:verified:${email}`;

const hashOtp = (otp) => createHash("sha256").update(otp).digest("hex");

export async function sendOtp(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const otp = randomInt(100000, 1000000).toString();

    // Remove previous verification if a new OTP is requested
    await redis.del(getVerifiedKey(email));

    // Store hashed OTP with 100-second expiration
    await redis.set(getOtpKey(email), hashOtp(otp), {
      ex: OTP_TTL,
    });

    // const { data, error } = await resend.emails.send({
    //   from: process.env.RESEND_FROM_EMAIL,
    //   to: email,
    //   subject: "Email Verification OTP",
    //   html: `
    //     <div style="font-family: Arial, sans-serif; padding: 20px;">
    //       <h2>Email Verification</h2>
    //       <p>Your verification OTP is:</p>
    //       <h1 style="letter-spacing: 5px;">${otp}</h1>
    //       <p>This OTP expires in 100 seconds.</p>
    //     </div>
    //   `,
    // });

    // if (error) {
    //   await redis.del(getOtpKey(email));
    //   throw new Error(error.message);
    // }
    try {
      await sendOtpEmail(email, otp);
    } catch (error) {
      await redis.del(getOtpKey(email));
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        email,
        expiresIn: OTP_TTL,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();
    const { otp } = req.body;

    const storedOtp = await redis.get(getOtpKey(email));

    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not requested",
      });
    }

    if (storedOtp !== hashOtp(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Mark email as verified for 10 minutes
    await redis.set(getVerifiedKey(email), "true", {
      ex: VERIFIED_TTL,
    });

    // OTP cannot be reused
    await redis.del(getOtpKey(email));

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (err) {
    next(err);
  }
}
