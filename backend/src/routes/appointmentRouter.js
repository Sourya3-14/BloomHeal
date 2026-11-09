import { Router } from "express";
import Appointment from "../models/Appointments.js"; // Adjust path as needed
import DoctorProfile from "../models/DoctorProfile.js";
import PatientProfile from "../models/PatientProfile.js";
import {
  sendAppointmentBookedNotifications,
  sendAppointmentAcceptedNotifications,
  sendAppointmentTimeChangedNotifications,
} from "../services/notification_service.js";
import { authRequired } from "../middlewares/auth.js";
import { restrictRole } from "../middlewares/restrict.js";
import { createGoogleMeet } from "../services/google_callender.service.js";

const router = Router();

router.use(authRequired);

async function getDoctorAndPatient(doctorId, patientId) {
  try {
    const [docProf, patProf] = await Promise.all([
      DoctorProfile.findById(doctorId).populate(
        "user",
        "email firstName lastName",
      ),
      PatientProfile.findById(patientId).populate(
        "user",
        "email firstName lastName",
      ),
    ]);

    const doctor = {
      name:
        docProf?.name ||
        (docProf?.user
          ? `${docProf.user.firstName} ${docProf.user.lastName}`.trim()
          : "Doctor"),
      email: docProf?.user?.email,
    };

    const patient = {
      name:
        patProf?.name ||
        (patProf?.user
          ? `${patProf.user.firstName} ${patProf.user.lastName}`.trim()
          : "Patient"),
      email: patProf?.user?.email,
    };

    return { doctor, patient };
  } catch (err) {
    console.error(
      "Failed to fetch doctor/patient details for notification:",
      err.message,
    );
    return { doctor: null, patient: null };
  }
}

// Book a new appointment
router.post("/book", authRequired, async (req, res, next) => {
  try {
    const { doctorId, patientId, requestedTime, reason } = req.body;

    // Validate required fields
    if (!doctorId || !patientId || !requestedTime) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID, Patient ID, and requested time are required",
      });
    }

    const appointmentTime = new Date(requestedTime);
    if (
      Number.isNaN(appointmentTime.getTime()) ||
      appointmentTime <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Requested time must be a valid future date",
      });
    }

    // Check if the requested time slot is already taken
    const existingAppointment = await Appointment.findOne({
      doctorId,
      requestedTime: appointmentTime,
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: "This time slot is already booked",
      });
    }

    const newAppointment = await Appointment.create({
      doctorId,
      patientId,
      requestedTime: appointmentTime,
      reason,
      status: "pending",
    });

    // Send notifications to Doctor and Patient asynchronously
    getDoctorAndPatient(doctorId, patientId)
      .then(({ doctor, patient }) => {
        if (doctor && patient) {
          sendAppointmentBookedNotifications({
            doctor,
            patient,
            requestedTime,
            reason,
          });
        }
      })
      .catch((err) =>
        console.error("Error dispatching booking notification:", err.message),
      );

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: newAppointment,
    });
  } catch (error) {
    next(error);
  }
});

async function acceptAppointment(req, res, next) {
  try {
    const appointmentId = req.params.id || req.body.appointmentId;
    const { scheduledTime, notes } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required",
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const doctorProfile = await DoctorProfile.findOne({
      _id: appointment.doctorId,
      user: req.user.id,
    }).select("_id");
    if (!doctorProfile) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (appointment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending appointments can be accepted",
      });
    }

    const appointmentTime = new Date(
      scheduledTime || appointment.requestedTime,
    );
    if (
      Number.isNaN(appointmentTime.getTime()) ||
      appointmentTime <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Scheduled time must be a valid future date",
      });
    }

    const conflictingAppointment = await Appointment.findOne({
      doctorId: appointment.doctorId,
      scheduledTime: appointmentTime,
      status: { $in: ["accepted", "scheduled"] },
      _id: { $ne: appointmentId },
    });
    if (conflictingAppointment) {
      return res.status(409).json({
        success: false,
        message: "The scheduled time conflicts with another appointment",
      });
    }

    appointment.status = "accepted";
    appointment.scheduledTime = appointmentTime;
    appointment.scheduledAt = appointmentTime;
    if (notes) appointment.notes = notes;
    await appointment.save();

    getDoctorAndPatient(appointment.doctorId, appointment.patientId)
      .then(({ doctor, patient }) => {
        if (doctor && patient) {
          sendAppointmentAcceptedNotifications({
            doctor,
            patient,
            scheduledTime: appointment.scheduledTime,
            notes: appointment.notes,
          });
        }
      })
      .catch((err) =>
        console.error(
          "Error dispatching acceptance notification:",
          err.message,
        ),
      );

    let meetUrl = null;
    try {
      meetUrl = await createGoogleMeet(appointment.doctorId, appointment);
    } catch (error) {
      console.error("Meet creation error:", error);
    }

    return res.status(meetUrl ? 200 : 202).json({
      success: true,
      message: meetUrl
        ? "Appointment accepted and meeting scheduled"
        : "Appointment accepted. Meeting link is unavailable or still being generated.",
      appointmentId: appointment._id,
      meetingStatus: appointment.meetingStatus,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
}

router.patch("/accept", restrictRole(["doctor"]), acceptAppointment);

// Change appointment time
router.patch(
  "/change-time",
  authRequired,
  restrictRole(["doctor"]),
  async (req, res, next) => {
    try {
      const { appointmentId, newTime, notes } = req.body;

      if (!appointmentId || !newTime) {
        return res.status(400).json({
          success: false,
          message: "Appointment ID and new time are required",
        });
      }

      const appointment = await Appointment.findById(appointmentId);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      if (!["pending", "accepted", "scheduled"].includes(appointment.status)) {
        return res.status(400).json({
          success: false,
          message: "Cannot change time for this appointment status",
        });
      }

      // Check for time conflicts
      const conflictingAppointment = await Appointment.findOne({
        doctorId: appointment.doctorId,
        $or: [
          { requestedTime: new Date(newTime) },
          { scheduledTime: new Date(newTime) },
        ],
        status: { $in: ["pending", "accepted", "scheduled"] },
        _id: { $ne: appointmentId },
      });

      if (conflictingAppointment) {
        return res.status(409).json({
          success: false,
          message: "The new time conflicts with another appointment",
        });
      }

      // Update the appropriate time field based on current status
      if (appointment.status === "pending") {
        appointment.requestedTime = new Date(newTime);
      } else {
        appointment.scheduledTime = new Date(newTime);
      }

      if (notes) appointment.notes = notes;

      await appointment.save();

      // Send notifications to Doctor and Patient asynchronously
      getDoctorAndPatient(appointment.doctorId, appointment.patientId)
        .then(({ doctor, patient }) => {
          if (doctor && patient) {
            sendAppointmentTimeChangedNotifications({
              doctor,
              patient,
              newTime,
              status: appointment.status,
              notes: appointment.notes,
            });
          }
        })
        .catch((err) =>
          console.error(
            "Error dispatching change-time notification:",
            err.message,
          ),
        );

      res.json({
        success: true,
        message: "Appointment time changed successfully",
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get doctor's appointments (should be GET method)
router.get(
  "/get-doctor-appointment",
  authRequired,
  restrictRole(["doctor"]),
  async (req, res, next) => {
    try {
      const { doctorId, status, page = 1, limit = 10 } = req.query;

      if (!doctorId) {
        return res.status(400).json({
          success: false,
          message: "Doctor ID is required",
        });
      }

      const query = { doctorId };
      if (status) {
        query.status = status;
      }

      const skip = (page - 1) * limit;

      const appointments = await Appointment.find(query)
        .populate("patientId", "name email phone") // Adjust fields based on your PatientProfile schema
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Appointment.countDocuments(query);

      res.json({
        success: true,
        data: appointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalAppointments: total,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get patient's appointments (should be GET method)
router.get("/get-patient-appointment", authRequired, async (req, res, next) => {
  try {
    const { patientId, status, page = 1, limit = 10 } = req.query;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    const query = { patientId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(query)
      .populate("doctorId", "name specialization email") // Adjust fields based on your DoctorProfile schema
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalAppointments: total,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Add this route to your appointmentRouter.js file

// Cancel an appointment
router.patch("/cancel", authRequired, async (req, res, next) => {
  try {
    const { appointmentId, reason } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required",
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if appointment can be cancelled
    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled",
      });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed appointment",
      });
    }

    // Update appointment status
    appointment.status = "cancelled";
    if (reason) {
      appointment.cancellationReason = reason;
    }
    appointment.cancelledAt = new Date();

    await appointment.save();

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/accept", restrictRole(["doctor"]), acceptAppointment);

export default router;
