/**
 * WhatsApp reminder message templates.
 */

import { Appointment, Patient, Clinician } from "@prisma/client";

type AppointmentWithRelations = Appointment & {
  patient: Patient;
  clinician: Clinician;
};

/** Format a Date for display in the Africa/Lagos timezone (or patient's timezone). */
function formatDateTime(date: Date, timezone: string): string {
  return date.toLocaleString("en-NG", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Build the 24-hour WhatsApp reminder message sent to the patient.
 * Includes confirm/cancel reply instructions.
 */
export function build24hReminderMessage(appt: AppointmentWithRelations): string {
  const patientName = appt.patient.preferredName ?? appt.patient.name ?? "there";
  const clinicianName = appt.clinician.name ?? "your clinician";
  const tz = appt.patient.timezone ?? "Africa/Lagos";
  const when = formatDateTime(appt.scheduledAt, tz);

  return [
    `Hello ${patientName} 👋`,
    ``,
    `This is a reminder that you have an appointment tomorrow:`,
    ``,
    `📅 *${when}*`,
    `👨‍⚕️ ${clinicianName}`,
    appt.reason ? `📋 Reason: ${appt.reason}` : null,
    ``,
    `Reply *CONFIRM* to confirm your attendance.`,
    `Reply *CANCEL* to cancel this appointment.`,
    ``,
    `If you have questions, simply reply to this message.`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/**
 * Build the missed-appointment follow-up message (loopback closure).
 * Sent when an appointment was not confirmed and has passed.
 */
export function buildMissedAppointmentMessage(appt: AppointmentWithRelations): string {
  const patientName = appt.patient.preferredName ?? appt.patient.name ?? "there";
  const tz = appt.patient.timezone ?? "Africa/Lagos";
  const when = formatDateTime(appt.scheduledAt, tz);

  return [
    `Hello ${patientName},`,
    ``,
    `We noticed you missed your appointment on *${when}*.`,
    ``,
    `We hope everything is okay. Would you like to reschedule?`,
    `Reply *RESCHEDULE* and we will find the next available slot for you.`,
  ].join("\n");
}
