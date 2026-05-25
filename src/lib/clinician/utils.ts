/**
 * Kehinde Clinician Utility Functions
 *
 * Pure functions for clinician availability checks and day formatting.
 * No database dependencies — safe to import in tests without Prisma.
 */

/** Minimal clinician shape needed for availability checks */
export interface ClinicianLike {
  availability: unknown;
}

/** Availability slot parsed from the JSON availability field */
interface AvailabilityWindow {
  days: string[];
  hours: { start: string; end: string };
}

/**
 * Get short day name (Mon, Tue, etc.) from a Date
 */
export function getDayName(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

/**
 * Validate that a clinician is available for a given time slot.
 * Checks day match and time window from availability JSON.
 */
export function isClinicianAvailable(
  clinician: ClinicianLike,
  scheduledAt: Date,
): boolean {
  if (!clinician.availability) {
    return true; // no constraints = always available
  }

  const avail = clinician.availability as unknown as AvailabilityWindow;
  const day = getDayName(scheduledAt);

  if (!avail.days || !avail.days.includes(day)) {
    return false;
  }

  if (avail.hours) {
    const timeStr = scheduledAt.toTimeString().slice(0, 5); // "HH:MM"
    return timeStr >= avail.hours.start && timeStr <= avail.hours.end;
  }

  return true;
}
