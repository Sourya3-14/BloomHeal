import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";

import "dotenv/config";

import { validationResult } from "express-validator";
import session from "express-session";

import { connectDB } from "./config/db.js";

import { Server } from "socket.io";
import http from "http";
import { initSocket } from "./socket.js";

import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import publicRoutes from "./routes/public.routes.js";
import ngoRoutes from "./routes/ngo.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import healthworkerRoutes from "./routes/healthworker.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import appointmentRouter from "./routes/appointmentRouter.js";
import chatRouter from "./routes/chat.routes.js";
import otpRoutes from "./routes/otp.routes.js";
import googleRoutes from "./routes/google.routes.js";

import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(morgan("dev"));

app.set("trust proxy", 1);

app.use(
  session({
    name: "app.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60 * 1000,
    },
  }),
);

// Validation middleware
app.use((req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errors.array(),
    });
  }

  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/otp", otpRoutes);
app.use("/profile", profileRoutes);
app.use("/", publicRoutes);

app.use("/ngo", ngoRoutes);
app.use("/doctor", doctorRoutes);
app.use("/healthworker", healthworkerRoutes);
app.use("/patient", patientRoutes);
app.use("/appointment", appointmentRouter);
app.use("/api/google", googleRoutes);
app.use("/chat", chatRouter);

// Health check
app.get("/health", (req, res) =>
  res.json({
    success: true,
    message: "OK",
  }),
);

// Error handler
app.use(errorHandler);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  },
});

initSocket(io);

io.on("connection", (socket) => {
  console.log("Connected", socket.id);

  socket.on("joinChat", (appointmentId) => {
    socket.join(appointmentId);

    console.log(socket.id, "joined", appointmentId);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected");
  });
});

// Start server
const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGODB_URI)
  .then(
    () =>
      server.listen(PORT, () =>
        console.log(`API running on http://localhost:${PORT}`),
      ),

    // server.listen(5000),
  )
  .catch((err) => {
    console.error("Mongo connect failed", err);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});
