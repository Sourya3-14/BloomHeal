import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid";
import DoctorProfile from "../models/DoctorProfile.js";
import { decrypt } from "../utils/encryption.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const createGoogleMeet = async (doctorId, appointment) => {
  const doctor = await DoctorProfile.findById(doctorId).select(
    "+googleRefreshToken",
  );

  if (!doctor?.googleCalendarConnected || !doctor.googleRefreshToken) {
    throw new Error("Doctor has not connected Google Calendar");
  }

  // Create a separate OAuth client for this doctor.
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  auth.setCredentials({
    refresh_token: decrypt(doctor.googleRefreshToken),
  });

  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  // Avoid creating duplicate calendar events.
  if (appointment.googleEventId) {
    const existing = await calendar.events.get({
      calendarId: "primary",
      eventId: appointment.googleEventId,
    });

    const existingLink = existing.data.conferenceData?.entryPoints?.find(
      (point) => point.entryPointType === "video",
    )?.uri;

    if (existingLink) {
      appointment.meetUrl = existingLink;
      appointment.meetingStatus = "READY";
      await appointment.save();

      return existingLink;
    }

    // An existing event may still be processing.
    throw new Error("Existing meeting conference is not ready yet");
  }

  const start = new Date(
    appointment.scheduledTime || appointment.scheduledAt || appointment.requestedTime,
  );
  const durationMinutes = Number(appointment.durationMinutes);

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new Error("Invalid appointment duration");
  }

  const end = new Date(
    start.getTime() + durationMinutes * 60 * 1000,
  );

  if (Number.isNaN(start.getTime()) || start <= new Date()) {
    throw new Error("Invalid or past appointment time");
  }

  appointment.meetingStatus = "PENDING";
  await appointment.save();

  const event = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    sendUpdates: "none",
    requestBody: {
      summary: "Patient consultation",
      description: "Scheduled consultation through the appointment platform.",
      start: {
        dateTime: start.toISOString(),
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: "Asia/Kolkata",
      },
      conferenceData: {
        createRequest: {
          requestId: uuidv4(),
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    },
  });

  appointment.googleEventId = event.data.id;
  await appointment.save();

  // Google generates conference details asynchronously.
  // Poll for a limited time.
  for (let attempt = 0; attempt < 10; attempt++) {
    await sleep(1000);

    const result = await calendar.events.get({
      calendarId: "primary",
      eventId: event.data.id,
    });

    const conference = result.data.conferenceData;

    if (conference?.createRequest?.status?.statusCode === "failure") {
      appointment.meetingStatus = "FAILED";
      await appointment.save();
      throw new Error("Google Meet conference generation failed");
    }

    const meetUrl = conference?.entryPoints?.find(
      (point) => point.entryPointType === "video",
    )?.uri;

    if (meetUrl) {
      appointment.meetUrl = meetUrl;
      appointment.meetingStatus = "READY";
      await appointment.save();

      return meetUrl;
    }
  }

  // The event exists, but Google may still be generating the link.
  // A background job should check it again later.
  return null;
};
