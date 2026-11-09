import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorProfile",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientProfile",
      required: true,
    },
    requestedTime: {
      type: Date,
      required: true,
    }, // when patient requests
    scheduledTime: {
      type: Date,
    }, // doctor sets this when accepted
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "scheduled",
        "ongoing",
        "ended",
        "cancelled",
      ],
      default: "pending",
    },
    reason: { type: String, default: null }, // patient’s reason
    notes: { type: String, default: null }, // doctor’s extra notes if any

    googleEventId: {
      type: String,
      default: null,
    },
    meetUrl: {
      type: String,
      default: null,
      select: false,
    },
    meetingStatus: {
      type: String,
      enum: ["NOT_CREATED", "PENDING", "READY", "FAILED"],
      default: "NOT_CREATED",
    },
    scheduledAt: {
      type: Date,
    },
    durationMinutes: {
      type: Number,
      default: 30,
    },
  },
  { timestamps: true },
);

AppointmentSchema.index({ doctorId: 1, requestedTime: 1 }, { unique: true });
AppointmentSchema.index(
  { doctorId: 1, scheduledTime: 1 },
  {
    unique: true,
    partialFilterExpression: { scheduledTime: { $type: "date" } },
  },
);

export default mongoose.model("Appointment", AppointmentSchema);
