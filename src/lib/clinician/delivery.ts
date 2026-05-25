/**
 * Kehinde Clinician Delivery Module
 *
 * Routes appointment requests to the correct clinician based on
 * specialty match, availability, and daily appointment load.
 *
 * Pure utility functions live in ./utils.ts
 */

import { PrismaClient, Clinician, Appointment } from "@prisma/client";
import { getDayName, isClinicianAvailable } from "./utils";

const prisma = new PrismaClient();

/** Availability slot parsed from the JSON availability field */
interface AvailabilityWindow {
  days: string[];
  hours: { start: string; end: string };
}

/** Result of clinician matching */
export interface ClinicianMatch {
  clinician: Clinician;
  score: number; // higher = better match
  reason: string;
}

/**
 * Find the best clinician for a given appointment.
 *
 * Scoring priorities:
 * 1. Specialty match (highest weight)
 * 2. Availability on the scheduled day
 * 3. Under daily appointment cap (load balancing)
 * 4. Randomized tie-breaking for fairness
 *
 * @returns The best-matched clinician, or null if none available
 */
export async function findClinicianForAppointment(
  appointment: Pick<Appointment, "scheduledAt" | "reason" | "id">,
): Promise<ClinicianMatch | null> {
  const clinicians = await prisma.clinician.findMany();

  if (clinicians.length === 0) {
    return null;
  }

  const scheduledDay = getDayName(appointment.scheduledAt);

  // Count today's appointments per clinician for load balancing
  const dayStart = new Date(appointment.scheduledAt);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const todayAppointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: dayStart, lt: dayEnd },
      status: { notIn: ["cancelled", "declined"] },
    },
    select: { clinicianId: true },
  });

  const clinicianLoad = new Map<string, number>();
  for (const appt of todayAppointments) {
    clinicianLoad.set(appt.clinicianId, (clinicianLoad.get(appt.clinicianId) ?? 0) + 1);
  }

  const scored: ClinicianMatch[] = clinicians.map((clinician) => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Specialty match (weight: 40)
    if (clinician.specialty && appointment.reason) {
      const reasonLower = appointment.reason.toLowerCase();
      const specialtyLower = clinician.specialty.toLowerCase();
      if (reasonLower.includes(specialtyLower) || specialtyLower.includes(reasonLower)) {
        score += 40;
        reasons.push("specialty match");
      }
    }

    // 2. Availability on scheduled day (weight: 30)
    if (clinician.availability) {
      const avail = clinician.availability as unknown as AvailabilityWindow;
      if (avail.days && avail.days.includes(scheduledDay)) {
        score += 30;
        reasons.push(`available ${scheduledDay}`);
      }
    } else {
      // No availability set = assume available (but lower score)
      score += 15;
      reasons.push("no availability constraints");
    }

    // 3. Under daily cap (weight: 20)
    const currentLoad = clinicianLoad.get(clinician.id) ?? 0;
    const capacityRatio = clinician.maxDailyAppts > 0
      ? Math.max(0, 1 - currentLoad / clinician.maxDailyAppts)
      : 1;
    score += Math.round(20 * capacityRatio);
    reasons.push(`load ${currentLoad}/${clinician.maxDailyAppts}`);

    // 4. Randomized tie-breaking (weight: 10)
    score += Math.floor(Math.random() * 10);
    reasons.push("fairness tie-break");

    return { clinician, score, reason: reasons.join("; ") };
  });

  // Sort by score descending, return best
  scored.sort((a, b) => b.score - a.score);

  // Filter out clinicians at capacity
  const available = scored.filter((match) => {
    const load = clinicianLoad.get(match.clinician.id) ?? 0;
    return load < match.clinician.maxDailyAppts;
  });

  return available.length > 0 ? available[0] : null;
}

/**
 * Get the count of today's appointments for a clinician.
 */
export async function getClinicianDailyLoad(
  clinicianId: string,
  date: Date = new Date(),
): Promise<number> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return prisma.appointment.count({
    where: {
      clinicianId,
      scheduledAt: { gte: dayStart, lt: dayEnd },
      status: { notIn: ["cancelled", "declined"] },
    },
  });
}
