/**
 * Kehinde Clinician Response Parser
 *
 * Pure functions for parsing clinician WhatsApp responses.
 * No database dependencies — safe to import in tests without Prisma.
 */

/**
 * Parsed clinician response action types.
 * - confirm: Clinician accepts the appointment
 * - decline: Clinician rejects the appointment
 * - propose: Clinician suggests an alternative time
 * - unknown: Could not classify the response
 */
export type ResponseAction = "confirm" | "decline" | "propose" | "unknown";

/**
 * Result of parsing a clinician's message.
 */
export interface ParsedResponse {
  action: ResponseAction;
  proposedTime: Date | null;
  confidence: number; // 0-1, how confident we are in the parse
  originalMessage: string;
}

// ── Pattern Definitions ──

const CONFIRM_PATTERNS: { pattern: RegExp; weight: number }[] = [
  { pattern: /\bconfirm(?:ed)?\b/i, weight: 0.95 },
  { pattern: /\bok(?:ay)?\b/i, weight: 0.7 },
  { pattern: /\byes\b/i, weight: 0.6 },
  { pattern: /\baccept(?:ed)?\b/i, weight: 0.9 },
  { pattern: /\bapprove(?:d)?\b/i, weight: 0.85 },
  { pattern: /\bgood\b/i, weight: 0.5 },
  { pattern: /\bfine\b/i, weight: 0.5 },
  { pattern: /\bsure\b/i, weight: 0.6 },
  { pattern: /\bworks?\b(?: for me)?\b/i, weight: 0.55 },
  { pattern: /\u2705/, weight: 0.9 }, // ✅
  { pattern: /👍/, weight: 0.8 }, // 👍
];

const DECLINE_PATTERNS: { pattern: RegExp; weight: number }[] = [
  { pattern: /\bdecline(?:d)?\b/i, weight: 0.95 },
  { pattern: /\bno\b/i, weight: 0.6 },
  { pattern: /\bcannot\b/i, weight: 0.8 },
  { pattern: /\bcan'?t\b/i, weight: 0.75 },
  { pattern: /\bunavailable\b/i, weight: 0.85 },
  { pattern: /\bnot available\b/i, weight: 0.85 },
  { pattern: /\bbusy\b/i, weight: 0.7 },
  { pattern: /\breject(?:ed)?\b/i, weight: 0.9 },
  { pattern: /\bwon'?t (?:be able|work)\b/i, weight: 0.75 },
  { pattern: /\bdoesn'?t work\b/i, weight: 0.7 },
];

const PROPOSE_PATTERNS: { pattern: RegExp; weight: number }[] = [
  { pattern: /\bpropose\b/i, weight: 0.95 },
  { pattern: /\breschedule\b/i, weight: 0.9 },
  { pattern: /\bhow about\b/i, weight: 0.85 },
  { pattern: /\bwhat about\b/i, weight: 0.8 },
  { pattern: /\bcan we (?:do|try|move|switch)\b/i, weight: 0.85 },
  { pattern: /\blet'?s (?:do|try|move|switch)\b/i, weight: 0.75 },
  { pattern: /\b(?:would|could) you (?:do|make it)\b/i, weight: 0.7 },
  { pattern: /\b(?:move|shift|push) (?:it|this|to)\b/i, weight: 0.8 },
  { pattern: /\b(?:move|shift|push) to\b/i, weight: 0.8 },
  { pattern: /\b(?:tomorrow|next week|next \w+|[A-Z][a-z]+day)\b/i, weight: 0.7 },
  { pattern: /\b\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm|AM|PM)\b/, weight: 0.8 },
];

// ── Parsing ──

/**
 * Parse a clinician's natural-language WhatsApp response into a structured action.
 *
 * Uses weighted pattern matching to classify the clinician's intent.
 * For "propose" actions, extracts the proposed time if present.
 *
 * @param message - Raw text message from the clinician
 * @returns ParsedResponse with action, confidence, and proposed time
 */
export function parseClinicianResponse(message: string): ParsedResponse {
  if (!message || typeof message !== "string") {
    return {
      action: "unknown",
      proposedTime: null,
      confidence: 0,
      originalMessage: "",
    };
  }

  const trimmed = message.trim().toLowerCase();
  const original = message.trim();

  if (trimmed.length === 0) {
    return { action: "unknown", proposedTime: null, confidence: 0, originalMessage: original };
  }

  let bestConfirm = 0;
  let bestDecline = 0;
  let bestPropose = 0;

  for (const { pattern, weight } of CONFIRM_PATTERNS) {
    if (pattern.test(message)) {
      bestConfirm = Math.max(bestConfirm, weight);
    }
  }

  for (const { pattern, weight } of DECLINE_PATTERNS) {
    if (pattern.test(message)) {
      bestDecline = Math.max(bestDecline, weight);
    }
  }

  for (const { pattern, weight } of PROPOSE_PATTERNS) {
    if (pattern.test(message)) {
      bestPropose = Math.max(bestPropose, weight);
    }
  }

  // Determine the winning action
  const scores: { action: ResponseAction; score: number }[] = [
    { action: "confirm", score: bestConfirm },
    { action: "decline", score: bestDecline },
    { action: "propose", score: bestPropose },
  ];

  scores.sort((a, b) => b.score - a.score);

  const winner = scores[0];

  if (winner.score === 0) {
    return { action: "unknown", proposedTime: null, confidence: 0, originalMessage: original };
  }

  // Resolve conflicts: if top two scores are within 0.15, flag as lower confidence
  const topScore = winner.score;
  const secondScore = scores[1].score;
  const confidence = topScore - secondScore < 0.15 ? topScore * 0.7 : topScore;

  // Extract proposed time for "propose" actions
  let proposedTime: Date | null = null;
  if (winner.action === "propose") {
    proposedTime = extractTime(original);
  }

  return {
    action: winner.action,
    proposedTime,
    confidence: Math.round(confidence * 100) / 100,
    originalMessage: original,
  };
}

// ── Time Extraction ──

/**
 * Attempt to extract a date/time from a message.
 * Handles formats like:
 * - "3pm", "3:00pm", "3 PM"
 * - "tomorrow 2pm", "next monday 10am"
 * - "Friday at 4pm"
 */
export function extractTime(message: string): Date | null {
  // Match time pattern: e.g., "3pm", "3:00 pm", "14:00"
  const timeMatch = message.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?\b/i);
  if (!timeMatch) return null;

  let hours = parseInt(timeMatch[1], 10);
  const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
  const meridiem = timeMatch[3]?.toLowerCase();

  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;

  // Check for day references
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setHours(hours, minutes, 0, 0);

  if (/\btomorrow\b/i.test(message)) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (/\bnext\s+(\w+)\b/i.test(message)) {
    const dayMatch = message.match(/\bnext\s+(\w+)\b/i);
    if (dayMatch) {
      const targetDay = getDayIndex(dayMatch[1]);
      if (targetDay >= 0) {
        const today = now.getDay();
        let daysUntil = targetDay - today + 7;
        if (daysUntil <= 7) daysUntil += 7; // "next X" means next week
        targetDate.setDate(targetDate.getDate() + daysUntil);
      }
    }
  } else {
    // Check for day-of-week names in the message
    for (let i = 0; i < 7; i++) {
      const dayName = getDayNameByIndex(i);
      const dayRegex = new RegExp(`\\b${dayName}\\b`, "i");
      if (dayRegex.test(message)) {
        let daysUntil = i - now.getDay();
        if (daysUntil <= 0) daysUntil += 7;
        targetDate.setDate(targetDate.getDate() + daysUntil);
        break;
      }
    }
  }

  // Don't return dates in the past
  if (targetDate <= now && !/\btomorrow\b/i.test(message) && !/\bnext\b/i.test(message)) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  return targetDate;
}

function getDayIndex(name: string): number {
  const days: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };
  return days[name.toLowerCase()] ?? -1;
}

function getDayNameByIndex(index: number): string {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return names[index] ?? "";
}
