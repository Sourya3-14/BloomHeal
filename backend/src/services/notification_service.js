import "dotenv/config";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
const APPS_SCRIPT_SECRET = process.env.APPS_SCRIPT_SECRET;

async function _sendEmail(to, subject, body) {
  if (!APPS_SCRIPT_URL || !APPS_SCRIPT_SECRET) {
    throw new Error("Google Apps Script email configuration is missing");
  }

  const payload = {
    token: APPS_SCRIPT_SECRET,
    to,
    subject,
    body,
  };

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: AbortSignal.timeout(60000),
    });

    console.info("Apps Script status:", response.status);
    console.info("Apps Script final URL:", response.url);

    const responseText = await response.text();
    console.info("Apps Script response:", responseText.slice(0, 1500));

    if (!response.ok) {
      throw new Error(`Apps Script HTTP error: ${response.status}`);
    }

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error("Invalid JSON response from Google Apps Script");
    }

    if (!result.success) {
      throw new Error(result.error || "Failed to send email");
    }

    return {
      success: true,
      messageId: result.messageId || null,
    };
  } catch (error) {
    console.error("Google Apps Script email request failed:", error.message);
    throw error;
  }
}

export const sendOtpEmail = async (email, otp) => {
  const body = `
Hello,

Your OTP for email verification is: ${otp}

This code is valid for 100 seconds. Do not share it with anyone.

If you did not request this, you can safely ignore this email.

Best regards,
Your Application Team
`;

  return _sendEmail(email, "Email Verification OTP", body);
};

export const sendNotification = async ({ to, subject, message }) => {
  const body = `
${subject}

${message}

This is an automated notification.
`;

  return _sendEmail(to, subject, body);
};

export const sendAppointmentBookedNotifications = async ({
  doctor,
  patient,
  requestedTime,
  reason,
}) => {
  try {
    const formattedTime = requestedTime
      ? new Date(requestedTime).toLocaleString()
      : "Pending";

    // 1. Notify Patient
    if (patient?.email) {
      const patientBody = `Hello ${patient.name || "Patient"},

Your appointment request has been submitted successfully to Dr. ${doctor?.name || "Doctor"}.

Appointment Details:
- Requested Time: ${formattedTime}
- Reason: ${reason || "General Consultation"}
- Status: Pending Confirmation

You will receive an email once the doctor reviews and accepts your appointment.

Best regards,
BloomHeal Healthcare Team`;

      await _sendEmail(
        patient.email,
        "Appointment Request Submitted - BloomHeal",
        patientBody
      ).catch((err) =>
        console.error("Failed to email patient on appointment booking:", err.message)
      );
    }

    // 2. Notify Doctor
    if (doctor?.email) {
      const doctorBody = `Hello Dr. ${doctor.name || "Doctor"},

You have received a new consultation request from ${patient?.name || "a patient"}.

Appointment Details:
- Patient Name: ${patient?.name || "N/A"}
- Requested Time: ${formattedTime}
- Reason: ${reason || "General Consultation"}
- Status: Pending Review

Please log in to your BloomHeal dashboard to review and manage this appointment.

Best regards,
BloomHeal Healthcare Team`;

      await _sendEmail(
        doctor.email,
        "New Appointment Request - BloomHeal",
        doctorBody
      ).catch((err) =>
        console.error("Failed to email doctor on appointment booking:", err.message)
      );
    }
  } catch (err) {
    console.error("Error in sendAppointmentBookedNotifications:", err.message);
  }
};

export const sendAppointmentAcceptedNotifications = async ({
  doctor,
  patient,
  scheduledTime,
  notes,
}) => {
  try {
    const formattedTime = scheduledTime
      ? new Date(scheduledTime).toLocaleString()
      : "Confirmed Time";

    // 1. Notify Patient
    if (patient?.email) {
      const patientBody = `Hello ${patient.name || "Patient"},

Great news! Your consultation with Dr. ${doctor?.name || "Doctor"} has been accepted and scheduled.

Appointment Details:
- Scheduled Time: ${formattedTime}
- Doctor: Dr. ${doctor?.name || "Doctor"}
${notes ? `- Doctor's Notes: ${notes}\n` : ""}- Status: Confirmed

Please log in to your BloomHeal dashboard at the scheduled time to access your consultation room and chat.

Best regards,
BloomHeal Healthcare Team`;

      await _sendEmail(
        patient.email,
        "Appointment Confirmed - BloomHeal",
        patientBody
      ).catch((err) =>
        console.error("Failed to email patient on appointment acceptance:", err.message)
      );
    }

    // 2. Notify Doctor
    if (doctor?.email) {
      const doctorBody = `Hello Dr. ${doctor.name || "Doctor"},

You have confirmed the appointment with ${patient?.name || "Patient"}.

Appointment Details:
- Patient: ${patient?.name || "N/A"}
- Scheduled Time: ${formattedTime}
${notes ? `- Notes: ${notes}\n` : ""}- Status: Confirmed

The consultation room will be available at the scheduled time.

Best regards,
BloomHeal Healthcare Team`;

      await _sendEmail(
        doctor.email,
        "Appointment Scheduled - BloomHeal",
        doctorBody
      ).catch((err) =>
        console.error("Failed to email doctor on appointment acceptance:", err.message)
      );
    }
  } catch (err) {
    console.error("Error in sendAppointmentAcceptedNotifications:", err.message);
  }
};

export const sendAppointmentTimeChangedNotifications = async ({
  doctor,
  patient,
  newTime,
  status,
  notes,
}) => {
  try {
    const formattedTime = newTime
      ? new Date(newTime).toLocaleString()
      : "Updated Time";

    // 1. Notify Patient
    if (patient?.email) {
      const patientBody = `Hello ${patient.name || "Patient"},

The scheduled time for your appointment with Dr. ${doctor?.name || "Doctor"} has been updated.

Updated Details:
- New Time: ${formattedTime}
- Status: ${status || "Updated"}
${notes ? `- Doctor's Notes: ${notes}\n` : ""}
Please check your BloomHeal dashboard for details.

Best regards,
BloomHeal Healthcare Team`;

      await _sendEmail(
        patient.email,
        "Appointment Time Updated - BloomHeal",
        patientBody
      ).catch((err) =>
        console.error("Failed to email patient on appointment time change:", err.message)
      );
    }

    // 2. Notify Doctor
    if (doctor?.email) {
      const doctorBody = `Hello Dr. ${doctor.name || "Doctor"},

You have updated the appointment time for ${patient?.name || "Patient"}.

Updated Details:
- New Time: ${formattedTime}
${notes ? `- Notes: ${notes}\n` : ""}
Best regards,
BloomHeal Healthcare Team`;

      await _sendEmail(
        doctor.email,
        "Appointment Time Change Confirmed - BloomHeal",
        doctorBody
      ).catch((err) =>
        console.error("Failed to email doctor on appointment time change:", err.message)
      );
    }
  } catch (err) {
    console.error("Error in sendAppointmentTimeChangedNotifications:", err.message);
  }
};

export const sendSignupWelcomeEmail = async ({ user }) => {
  try {
    if (!user?.email) return;
    const roleTitle = user.role
      ? user.role.replace("_", " ").toUpperCase()
      : "MEMBER";

    const body = `Hello ${user.firstName || "there"} ${user.lastName || ""},

Welcome to BloomHeal! Your account has been registered successfully.

Account Details:
- Email: ${user.email}
- Registered Role: ${roleTitle}
${user.phone ? `- Phone: ${user.phone}\n` : ""}${user.location ? `- Location: ${user.location}\n` : ""}
You can now log in to the BloomHeal platform to access healthcare services, manage your profile, and connect with trusted providers.

Best regards,
BloomHeal Healthcare Team`;

    await _sendEmail(user.email, "Welcome to BloomHeal!", body).catch((err) =>
      console.error("Failed to send signup welcome email:", err.message)
    );
  } catch (err) {
    console.error("Error in sendSignupWelcomeEmail:", err.message);
  }
};

export const sendLoginAlertEmail = async ({ user, loginTime = new Date() }) => {
  try {
    if (!user?.email) return;
    const formattedTime = new Date(loginTime).toLocaleString();

    const body = `Hello ${user.firstName || "there"} ${user.lastName || ""},

This is a security alert to inform you that your BloomHeal account was just accessed.

Login Details:
- Time: ${formattedTime}
- Account: ${user.email}

If this was you, you can safely ignore this email. If you did not initiate this login, please reset your password immediately.

Best regards,
BloomHeal Security Team`;

    await _sendEmail(
      user.email,
      "Security Alert: New Login to BloomHeal",
      body
    ).catch((err) =>
      console.error("Failed to send login alert email:", err.message)
    );
  } catch (err) {
    console.error("Error in sendLoginAlertEmail:", err.message);
  }
};
