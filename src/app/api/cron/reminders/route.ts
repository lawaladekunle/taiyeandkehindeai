/**
 * Cron endpoint: POST /api/cron/reminders
 *
 * Intended to be called by a cron scheduler (e.g. Vercel Cron, GitHub Actions)
 * on an hourly basis. On each invocation it:
 *
 *   1. Sends 24-hour WhatsApp reminders for appointments scheduled in the next
 *      24–25 hours that have no prior reminder sent.
 *   2. Sends missed-appointment follow-ups for appointments that were in a
 *      "pending" or "confirmed" state but whose scheduled time has passed.
 *
 * Protected by the CRON_SECRET header to prevent unauthorised calls.
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createWhatsAppClient } from "@/lib/whatsapp/client";
import {
  build24hReminderMessage,
  buildMissedAppointmentMessage,
} from "@/lib/reminders/templates";

const prisma = new PrismaClient();

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("x-cron-secret");
  return header === secret;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // ── 1. 24-hour reminders ──────────────────────────────────────────────────
  // Window: [now + 23h, now + 25h] to handle scheduling jitter from hourly cron
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: windowStart, lt: windowEnd },
      status: { in: ["pending", "confirmed"] },
      reminders: { none: { status: "sent" } },
    },
    include: { patient: true, clinician: true },
  });

  const reminderResults: { appointmentId: string; status: string; error?: string }[] = [];

  const whatsapp = createWhatsAppClient();

  for (const appt of upcomingAppointments) {
    const reminder = await prisma.reminder.create({
      data: {
        appointmentId: appt.id,
        sendAt: now,
        channel: "whatsapp",
        status: "pending",
      },
    });

    try {
      const message = build24hReminderMessage(appt);
      const to = `whatsapp:${appt.patient.phoneNumber}`;
      await whatsapp.sendTextMessage(to, message);

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "sent", sentAt: new Date() },
      });

      reminderResults.push({ appointmentId: appt.id, status: "sent" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "failed", errorMessage },
      });

      reminderResults.push({ appointmentId: appt.id, status: "failed", error: errorMessage });
    }
  }

  // ── 2. Missed-appointment loopback closure ────────────────────────────────
  // Appointments that were pending/confirmed whose scheduled time has passed.
  // We mark them as "completed" (missed) and send a follow-up message.
  // Dedup: the status transition to "completed" ensures the same appointment
  // is never picked up twice; no separate reminder-type filter needed.
  const missedCutoff = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours past

  const missedAppointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: { lt: missedCutoff },
      status: { in: ["pending", "confirmed"] },
    },
    include: { patient: true, clinician: true },
  });

  const loopbackResults: { appointmentId: string; status: string; error?: string }[] = [];

  for (const appt of missedAppointments) {
    try {
      const message = buildMissedAppointmentMessage(appt);
      const to = `whatsapp:${appt.patient.phoneNumber}`;
      await whatsapp.sendTextMessage(to, message);

      // Mark appointment completed (missed) and log the follow-up reminder
      await prisma.$transaction([
        prisma.appointment.update({
          where: { id: appt.id },
          data: { status: "completed" },
        }),
        prisma.reminder.create({
          data: {
            appointmentId: appt.id,
            sendAt: now,
            channel: "whatsapp",
            status: "sent",
            sentAt: now,
          },
        }),
      ]);

      loopbackResults.push({ appointmentId: appt.id, status: "sent" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      loopbackResults.push({ appointmentId: appt.id, status: "failed", error: errorMessage });
    }
  }

  return NextResponse.json({
    ok: true,
    reminders: { sent: reminderResults.filter((r) => r.status === "sent").length, results: reminderResults },
    loopback: { sent: loopbackResults.filter((r) => r.status === "sent").length, results: loopbackResults },
  });
}
