require("dotenv").config();

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

/**
 * Notify submitter when their disease outbreak report has been verified on-chain.
 */
async function sendOutbreakVerifiedNotification({
  submitterEmail,
  submitterName,
  diseaseCategory,
  reportType,
  location,
  verifierRole,
}) {
  try {
    if (!submitterEmail) return;

    const locString = location
      ? `${location.district ? location.district + ", " : ""}${location.state ? location.state + ", " : ""}${location.country || ""}`.trim()
      : "Reported Location";

    const verifierTitle = verifierRole
      ? verifierRole.replace("_", " ").toUpperCase()
      : "VERIFIED HEALTH OFFICIAL";

    const body = `Hello ${submitterName || "Contributor"},

Thank you for contributing to the BloomHeal decentralized health surveillance network.

Your reported health event has been formally reviewed and verified on-chain:
- Report Type: ${reportType || "Outbreak Report"}
- Disease / Category: ${diseaseCategory || "Infectious Disease"}
- Location: ${locString}
- Verified By: Authorized ${verifierTitle}
- Verification Status: Anchored to Ethereum Sepolia Ledger

Your report is now an immutable public record that assists regional healthcare workers, NGOs, and medical authorities in coordinating rapid community interventions.

Best regards,
BloomHeal Health Surveillance Team`;

    await _sendEmail(
      submitterEmail,
      "Outbreak Report Verified On-Chain - BloomHeal",
      body
    ).catch((err) =>
      console.error(
        "Failed to send outbreak verification notification:",
        err.message
      )
    );
  } catch (err) {
    console.error("Error in sendOutbreakVerifiedNotification:", err.message);
  }
}

/**
 * Notify participant when their event attendance has been verified and token rewards dispatched.
 */
async function sendEventParticipationVerifiedNotification({
  participantEmail,
  participantName,
  eventName,
  eventDate,
  eventLocation,
  rewardAmount = 10,
  walletAddress,
}) {
  try {
    if (!participantEmail) return;

    const formattedDate = eventDate
      ? new Date(eventDate).toLocaleDateString()
      : "Scheduled Date";

    const body = `Hello ${participantName || "Participant"},

Congratulations! Your attendance and participation have been verified by the event organizer.

Event Details:
- Event: ${eventName || "Community Health Event"}
- Date: ${formattedDate}
- Location: ${eventLocation || "Event Location"}
- Status: Attendance Confirmed
- Reward Tokens Dispatched: ${rewardAmount} WNT
${walletAddress ? `- Linked Wallet Address: ${walletAddress}\n` : ""}
Thank you for your active participation in community healthcare initiatives. You can view your updated token balance and claim synchronized rewards from your BloomHeal profile dashboard.

Best regards,
BloomHeal Community Events Team`;

    await _sendEmail(
      participantEmail,
      "Event Participation Verified & Rewards Credited - BloomHeal",
      body
    ).catch((err) =>
      console.error(
        "Failed to send event participation notification:",
        err.message
      )
    );
  } catch (err) {
    console.error(
      "Error in sendEventParticipationVerifiedNotification:",
      err.message
    );
  }
}

module.exports = {
  _sendEmail,
  sendOutbreakVerifiedNotification,
  sendEventParticipationVerifiedNotification,
};

