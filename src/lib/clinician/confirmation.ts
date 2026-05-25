/**
 * Kehinde Clinician Confirmation Module
 *
 * Handles confirm/decline/reschedule workflow by updating appointments
 * in the database and generating patient-facing messages.
 *
 * Pure parsing logic lives in ./parser.ts
 */

import { PrismaClient, Appointment } from "@prisma/client";
import { ParsedResponse } from "./parser";

const prisma = new PrismaClient();

/**
 * Result after handling a confirmation action.
 */
export interface ConfirmationResult {
  success: boolean;
  appointment?: Appointment;
  error?: string;
  patientMessage?: string;
}

// ── Confirmation Handling ──

/**
 * Handle a clinician's confirmation response and update the appointment.
 *
 * Workflow:
 * - confirm: status → "confirmed", patient gets confirmation message
 * - decline: status → "declined", patient gets rebooking prompt
 * - propose: status → "reschedule_proposed", patient gets alternate time option
 *
 * @param parsed - The parsed clinician response
 * @param appointmentId - The appointment to update
 * @returns Result with updated appointment and patient-facing message
 */
export async function handleConfirmation(
  parsed: ParsedResponse,
  appointmentId: string,
): Promise<ConfirmationResult> {
  if (parsed.action === "unknown") {
    return {
      success: false,
      error: "Could not classify clinician response. Please reply confirm, decline, or propose a time.",
    };
  }

  if (parsed.confidence < 0.5) {
    return {
      success: false,
      error: `Unclear response (confidence: ${parsed.confidence}). Please reply clearly with confirm, decline, or propose a time.`,
    };
  }

  // Fetch the current appointment
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: true, clinician: true },
  });

  if (!appointment) {
    return { success: false, error: `Appointment ${appointmentId} not found.` };
  }

  if (appointment.status !== "pending") {
    return {
      success: false,
      error: `Appointment is already ${appointment.status}. Only pending appointments can be confirmed/declined.`,
    };
  }

  switch (parsed.action) {
    case "confirm":
      return handleConfirm(appointment);
    case "decline":
      return handleDecline(appointment);
    case "propose":
      return handlePropose(appointment, parsed);
    default:
      return { success: false, error: "Unknown response action." };
  }
}

async function handleConfirm(appointment: Appointment & { patient: { name: string | null; phoneNumber: string }; clinician: { name: string | null } }): Promise<ConfirmationResult> {
  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "confirmed" },
  });

  const clinicianName = appointment.clinician.name ?? "Your clinician";
  const patientName = appointment.patient.name ?? "Patient";

  const patientMessage = [
    `✅ *Appointment Confirmed*`,
    ``,
    `${patientName}, your appointment with ${clinicianName} has been confirmed.`,
    ``,
    `📅 Date: ${formatDate(appointment.scheduledAt)}`,
    `⏰ Time: ${formatTime(appointment.scheduledAt)}`,
    `${appointment.reason ? `📋 Reason: ${appointment.reason}` : ""}`,
    ``,
    `You will receive a reminder 24 hours before your appointment.`,
  ].filter(Boolean).join("\n");

  return { success: true, appointment: updated, patientMessage };
}

async function handleDecline(appointment: Appointment & { patient: { name: string | null; phoneNumber: string }; clinician: { name: string | null } }): Promise<ConfirmationResult> {
  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "declined" },
  });

  const patientName = appointment.patient.name ?? "Patient";

  const patientMessage = [
    `📅 *Appointment Update*`,
    ``,
    `${patientName}, unfortunately the clinician is not available at the requested time.`,
    ``,
    `We can help you find another time. Please reply with your preferred date and time, or we can suggest available slots.`,
  ].join("\n");

  return { success: true, appointment: updated, patientMessage };
}

async function handlePropose(
  appointment: Appointment & { patient: { name: string | null; phoneNumber: string }; clinician: { name: string | null } },
  parsed: ParsedResponse,
): Promise<ConfirmationResult> {
  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "reschedule_proposed" },
  });

  const patientName = appointment.patient.name ?? "Patient";
  const clinicianName = appointment.clinician.name ?? "Your clinician";

  let timeLine = "";
  if (parsed.proposedTime) {
    timeLine = `${clinicianName} has proposed ${formatDate(parsed.proposedTime)} at ${formatTime(parsed.proposedTime)}.`;
  } else {
    timeLine = `${clinicianName} has proposed an alternative time.`;
  }

  const patientMessage = [
    `🔄 *Reschedule Proposed*`,
    ``,
    `${patientName}, the clinician has suggested a schedule change:`,
    ``,
    `"${parsed.originalMessage}"`,
    ``,
    `> ${timeLine}`,
    ``,
    `Please reply with "confirm" to accept the new time, or "decline" to request another option.`,
  ].join("\n");

  return { success: true, appointment: updated, patientMessage };
}

// ── Formatting Helpers ──

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
