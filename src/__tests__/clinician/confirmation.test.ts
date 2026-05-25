/**
 * Kehinde Clinician Confirmation + Delivery — Comprehensive Test Suite
 *
 * Tests pure parsing logic and delivery utilities.
 * Database-dependent functions (handleConfirmation, findClinicianForAppointment)
 * are deferred to integration tests.
 */

import {
  parseClinicianResponse,
  extractTime,
} from "@/lib/clinician/parser";
import {
  isClinicianAvailable,
  getDayName,
} from "@/lib/clinician/utils";

// Minimal clinician type for testing — avoids Prisma dependency
interface TestClinician {
  id: string;
  phoneNumber: string;
  name: string | null;
  specialty: string | null;
  availability: unknown;
  maxDailyAppts: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Helpers ──

function makeClinician(overrides: Partial<TestClinician> = {}): TestClinician {
  return {
    id: "clin-001",
    phoneNumber: "+2348012345678",
    name: "Dr. Adebayo",
    specialty: "General Practice",
    availability: {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      hours: { start: "09:00", end: "17:00" },
    },
    maxDailyAppts: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// parseClinicianResponse — Confirm Patterns
// ============================================================================

describe("parseClinicianResponse — confirm patterns", () => {
  it('recognizes "confirm"', () => {
    const result = parseClinicianResponse("confirm");
    expect(result.action).toBe("confirm");
    expect(result.confidence).toBeGreaterThan(0.9);
    expect(result.proposedTime).toBeNull();
  });

  it('recognizes "confirmed"', () => {
    const result = parseClinicianResponse("confirmed");
    expect(result.action).toBe("confirm");
  });

  it('recognizes "ok" as confirm', () => {
    const result = parseClinicianResponse("ok");
    expect(result.action).toBe("confirm");
  });

  it('recognizes "okay" as confirm', () => {
    const result = parseClinicianResponse("okay");
    expect(result.action).toBe("confirm");
  });

  it('recognizes "yes"', () => {
    const result = parseClinicianResponse("yes");
    expect(result.action).toBe("confirm");
  });

  it('recognizes "accepted"', () => {
    const result = parseClinicianResponse("accepted");
    expect(result.action).toBe("confirm");
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('recognizes "approved"', () => {
    const result = parseClinicianResponse("approved");
    expect(result.action).toBe("confirm");
  });

  it('recognizes "sure"', () => {
    const result = parseClinicianResponse("sure");
    expect(result.action).toBe("confirm");
  });

  it('recognizes "good"', () => {
    const result = parseClinicianResponse("good");
    expect(result.action).toBe("confirm");
  });

  it('recognizes "fine"', () => {
    const result = parseClinicianResponse("fine");
    expect(result.action).toBe("confirm");
  });

  it('recognizes "works for me"', () => {
    const result = parseClinicianResponse("works for me");
    expect(result.action).toBe("confirm");
  });

  it('recognizes "Ok, confirmed" (compound)', () => {
    const result = parseClinicianResponse("Ok, confirmed");
    expect(result.action).toBe("confirm");
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("recognizes ✅ emoji", () => {
    const result = parseClinicianResponse("✅");
    expect(result.action).toBe("confirm");
  });

  it("recognizes 👍 emoji", () => {
    const result = parseClinicianResponse("👍");
    expect(result.action).toBe("confirm");
  });

  it("is case-insensitive", () => {
    const result = parseClinicianResponse("CONFIRMED");
    expect(result.action).toBe("confirm");
  });
});

// ============================================================================
// parseClinicianResponse — Decline Patterns
// ============================================================================

describe("parseClinicianResponse — decline patterns", () => {
  it('recognizes "decline"', () => {
    const result = parseClinicianResponse("decline");
    expect(result.action).toBe("decline");
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('recognizes "declined"', () => {
    const result = parseClinicianResponse("declined");
    expect(result.action).toBe("decline");
  });

  it('recognizes "no"', () => {
    const result = parseClinicianResponse("no");
    expect(result.action).toBe("decline");
  });

  it('recognizes "cannot"', () => {
    const result = parseClinicianResponse("cannot");
    expect(result.action).toBe("decline");
  });

  it('recognizes "can\'t"', () => {
    const result = parseClinicianResponse("can't");
    expect(result.action).toBe("decline");
  });

  it('recognizes "unavailable"', () => {
    const result = parseClinicianResponse("unavailable");
    expect(result.action).toBe("decline");
  });

  it('recognizes "not available"', () => {
    const result = parseClinicianResponse("not available");
    expect(result.action).toBe("decline");
  });

  it('recognizes "busy"', () => {
    const result = parseClinicianResponse("busy");
    expect(result.action).toBe("decline");
  });

  it('recognizes "rejected"', () => {
    const result = parseClinicianResponse("rejected");
    expect(result.action).toBe("decline");
  });

  it('recognizes "won\'t be able"', () => {
    const result = parseClinicianResponse("won't be able");
    expect(result.action).toBe("decline");
  });

  it('recognizes "doesn\'t work"', () => {
    const result = parseClinicianResponse("doesn't work");
    expect(result.action).toBe("decline");
  });
});

// ============================================================================
// parseClinicianResponse — Propose Patterns
// ============================================================================

describe("parseClinicianResponse — propose patterns", () => {
  it('recognizes "propose"', () => {
    const result = parseClinicianResponse("propose");
    expect(result.action).toBe("propose");
  });

  it('recognizes "reschedule"', () => {
    const result = parseClinicianResponse("reschedule");
    expect(result.action).toBe("propose");
  });

  it('recognizes "how about"', () => {
    const result = parseClinicianResponse("how about 3pm");
    expect(result.action).toBe("propose");
  });

  it('recognizes "what about"', () => {
    const result = parseClinicianResponse("what about tomorrow");
    expect(result.action).toBe("propose");
  });

  it('recognizes "can we do"', () => {
    const result = parseClinicianResponse("can we do Friday");
    expect(result.action).toBe("propose");
  });

  it('recognizes "can we try"', () => {
    const result = parseClinicianResponse("can we try 2pm");
    expect(result.action).toBe("propose");
  });

  it('recognizes "can we move"', () => {
    const result = parseClinicianResponse("can we move to 4pm");
    expect(result.action).toBe("propose");
  });

  it('recognizes "let\'s do"', () => {
    const result = parseClinicianResponse("let's do Monday");
    expect(result.action).toBe("propose");
  });

  it('recognizes "move it to"', () => {
    const result = parseClinicianResponse("move it to Tuesday 10am");
    expect(result.action).toBe("propose");
  });

  it("extracts time from propose message", () => {
    const result = parseClinicianResponse("propose 3pm tomorrow");
    expect(result.action).toBe("propose");
    expect(result.proposedTime).not.toBeNull();
    expect(result.proposedTime!.getHours()).toBe(15);
    expect(result.proposedTime!.getMinutes()).toBe(0);
  });

  it("extracts time with minutes", () => {
    const result = parseClinicianResponse("how about 2:30 pm");
    expect(result.action).toBe("propose");
    expect(result.proposedTime).not.toBeNull();
    expect(result.proposedTime!.getHours()).toBe(14);
    expect(result.proposedTime!.getMinutes()).toBe(30);
  });

  it("detects tomorrow reference", () => {
    const result = parseClinicianResponse("can we do tomorrow 11am");
    expect(result.action).toBe("propose");
    expect(result.proposedTime).not.toBeNull();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(result.proposedTime!.getDate()).toBe(tomorrow.getDate());
  });
});

// ============================================================================
// parseClinicianResponse — Edge Cases & Ambiguity
// ============================================================================

describe("parseClinicianResponse — edge cases", () => {
  it("returns unknown for empty string", () => {
    const result = parseClinicianResponse("");
    expect(result.action).toBe("unknown");
    expect(result.confidence).toBe(0);
    expect(result.originalMessage).toBe("");
  });

  it("returns unknown for whitespace-only", () => {
    const result = parseClinicianResponse("   ");
    expect(result.action).toBe("unknown");
  });

  it("handles null/undefined gracefully", () => {
    const result = parseClinicianResponse(null as unknown as string);
    expect(result.action).toBe("unknown");
    expect(result.confidence).toBe(0);
  });

  it("returns unknown for gibberish", () => {
    const result = parseClinicianResponse("asdfghjkl123");
    expect(result.action).toBe("unknown");
    expect(result.confidence).toBe(0);
  });

  it("returns unknown for random emojis", () => {
    const result = parseClinicianResponse("🎉🎊🐱");
    expect(result.action).toBe("unknown");
  });

  it("preserves original message", () => {
    const result = parseClinicianResponse("Yes please confirm this");
    expect(result.originalMessage).toBe("Yes please confirm this");
  });

  it("handles very long messages", () => {
    const long = "confirm ".repeat(200);
    const result = parseClinicianResponse(long);
    expect(result.action).toBe("confirm");
  });

  it("resolves confirm vs decline conflict: confirm wins when both present", () => {
    const result = parseClinicianResponse("yes no");
    expect(result.action).toBe("confirm");
  });

  it("resolves propose vs confirm: propose wins with stronger signal", () => {
    const result = parseClinicianResponse("can we do 3pm? ok?");
    expect(result.action).toBe("propose");
  });

  it("handles mixed case input", () => {
    const result = parseClinicianResponse("CoNfIrMeD");
    expect(result.action).toBe("confirm");
  });

  it("handles messages with extra whitespace", () => {
    const result = parseClinicianResponse("  confirmed  ");
    expect(result.action).toBe("confirm");
  });
});

// ============================================================================
// parseClinicianResponse — Nigerian English Variants
// ============================================================================

describe("parseClinicianResponse — Nigerian English variants", () => {
  it('recognizes "no wahala" (no) as decline', () => {
    const result = parseClinicianResponse("no wahala");
    expect(result.action).toBe("decline");
  });

  it('recognizes "oya confirm" as confirm', () => {
    const result = parseClinicianResponse("oya confirm");
    expect(result.action).toBe("confirm");
  });

  it('recognizes "abeg shift am" as unknown (no match)', () => {
    const result = parseClinicianResponse("abeg shift am");
    expect(result.action).toBe("unknown");
  });

  it('recognizes "na confirmed" as confirm', () => {
    const result = parseClinicianResponse("na confirmed");
    expect(result.action).toBe("confirm");
  });

  it('recognizes "I dey OK" as confirm', () => {
    const result = parseClinicianResponse("I dey OK");
    expect(result.action).toBe("confirm");
  });
});

// ============================================================================
// isClinicianAvailable
// ============================================================================

describe("isClinicianAvailable", () => {
  it("returns true when clinician has no availability constraints", () => {
    const clinician = makeClinician({ availability: null });
    const result = isClinicianAvailable(clinician, new Date("2026-05-26T10:00:00"));
    expect(result).toBe(true);
  });

  it("returns true for a weekday within hours", () => {
    const clinician = makeClinician();
    // May 26, 2026 is a Tuesday
    const result = isClinicianAvailable(clinician, new Date("2026-05-26T10:00:00"));
    expect(result).toBe(true);
  });

  it("returns false for a weekend when only weekdays available", () => {
    const clinician = makeClinician();
    // May 31, 2026 is a Sunday
    const result = isClinicianAvailable(clinician, new Date("2026-05-31T10:00:00"));
    expect(result).toBe(false);
  });

  it("returns false for hours outside window", () => {
    const clinician = makeClinician();
    // 8 AM on Tuesday — before 9 AM start
    const result = isClinicianAvailable(clinician, new Date("2026-05-26T08:00:00"));
    expect(result).toBe(false);
  });

  it("returns false for hours after window", () => {
    const clinician = makeClinician();
    // 6 PM on Tuesday — after 5 PM end
    const result = isClinicianAvailable(clinician, new Date("2026-05-26T18:00:00"));
    expect(result).toBe(false);
  });

  it("returns true at the boundary start time", () => {
    const clinician = makeClinician();
    const result = isClinicianAvailable(clinician, new Date("2026-05-26T09:00:00"));
    expect(result).toBe(true);
  });

  it("returns true at the boundary end time", () => {
    const clinician = makeClinician();
    const result = isClinicianAvailable(clinician, new Date("2026-05-26T17:00:00"));
    expect(result).toBe(true);
  });

  it("works with custom day config (weekend clinician)", () => {
    const clinician = makeClinician({
      availability: {
        days: ["Sat", "Sun"],
        hours: { start: "10:00", end: "14:00" },
      },
    });
    // May 31, 2026 is a Sunday
    const result = isClinicianAvailable(clinician, new Date("2026-05-31T11:00:00"));
    expect(result).toBe(true);
  });
});

// ============================================================================
// getDayName
// ============================================================================

describe("getDayName", () => {
  it('returns "Tue" for a Tuesday', () => {
    const result = getDayName(new Date("2026-05-26"));
    expect(result).toBe("Tue");
  });

  it('returns "Mon" for a Monday', () => {
    const result = getDayName(new Date("2026-05-25"));
    expect(result).toBe("Mon");
  });

  it('returns "Sun" for a Sunday', () => {
    const result = getDayName(new Date("2026-05-31"));
    expect(result).toBe("Sun");
  });

  it('returns "Sat" for a Saturday', () => {
    const result = getDayName(new Date("2026-05-30"));
    expect(result).toBe("Sat");
  });
});

// ============================================================================
// extractTime
// ============================================================================

describe("extractTime", () => {
  it("extracts 12-hour PM time", () => {
    const result = extractTime("propose 3pm");
    expect(result).not.toBeNull();
    expect(result!.getHours()).toBe(15);
  });

  it("extracts 12-hour AM time", () => {
    const result = extractTime("propose 9am");
    expect(result!.getHours()).toBe(9);
  });

  it("extracts noon correctly", () => {
    const result = extractTime("propose 12pm");
    expect(result!.getHours()).toBe(12);
  });

  it("extracts midnight correctly", () => {
    const result = extractTime("propose 12am");
    expect(result!.getHours()).toBe(0);
  });

  it("handles time with colon", () => {
    const result = extractTime("how about 2:30 pm");
    expect(result!.getHours()).toBe(14);
    expect(result!.getMinutes()).toBe(30);
  });

  it("returns null when no time found", () => {
    const result = extractTime("can we reschedule?");
    expect(result).toBeNull();
  });

  it("does not return a past time", () => {
    const result = extractTime("1am");
    // Should be in the future
    if (result) {
      expect(result.getTime()).toBeGreaterThan(Date.now() - 1000);
    }
  });
});

// ============================================================================
// ParsedResponse structure
// ============================================================================

describe("ParsedResponse structure", () => {
  it("has all required fields for confirm", () => {
    const result = parseClinicianResponse("confirm");
    expect(result).toHaveProperty("action");
    expect(result).toHaveProperty("proposedTime");
    expect(result).toHaveProperty("confidence");
    expect(result).toHaveProperty("originalMessage");
  });

  it("has proposedTime null for non-propose actions", () => {
    const result = parseClinicianResponse("confirm");
    expect(result.proposedTime).toBeNull();
  });

  it("has proposedTime null for decline", () => {
    const result = parseClinicianResponse("decline");
    expect(result.proposedTime).toBeNull();
  });

  it("confidence is between 0 and 1", () => {
    const result = parseClinicianResponse("confirmed");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("confidence rounds to 2 decimal places", () => {
    const result = parseClinicianResponse("confirm");
    const confidenceStr = result.confidence.toString();
    const decimalPlaces = confidenceStr.includes(".")
      ? confidenceStr.split(".")[1].length
      : 0;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });
});

// ============================================================================
// Confidence scoring
// ============================================================================

describe("confidence scoring", () => {
  it("high confidence for exact match", () => {
    const result = parseClinicianResponse("confirmed");
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("lower confidence for weak signal", () => {
    const result = parseClinicianResponse("fine");
    expect(result.confidence).toBeLessThan(0.9);
  });

  it("zero confidence for unknown", () => {
    const result = parseClinicianResponse("xyzzy");
    expect(result.confidence).toBe(0);
  });

  it("medium confidence for ambiguous 'ok'", () => {
    const result = parseClinicianResponse("ok");
    expect(result.action).toBe("confirm");
    expect(result.confidence).toBeLessThan(0.9);
  });
});

// ============================================================================
// All three action paths via parser
// ============================================================================

describe("all three action paths", () => {
  it("confirm path: parse → validate action → (integration: update DB → send message)", () => {
    expect(parseClinicianResponse("confirm").action).toBe("confirm");
    expect(parseClinicianResponse("decline").action).toBe("decline");
    expect(parseClinicianResponse("propose 3pm").action).toBe("propose");
  });

  it("unknown response has zero confidence and unknown action", () => {
    const result = parseClinicianResponse("random text 12345");
    expect(result.action).toBe("unknown");
    expect(result.confidence).toBe(0);
  });

  it("confirm parse pipeline produces correct action", () => {
    const result = parseClinicianResponse("confirm");
    expect(result.action).toBe("confirm");
  });

  it("decline parse pipeline produces correct action", () => {
    const result = parseClinicianResponse("decline");
    expect(result.action).toBe("decline");
  });

  it("propose parse pipeline produces correct action", () => {
    const result = parseClinicianResponse("propose 2pm");
    expect(result.action).toBe("propose");
  });
});

// ============================================================================
// Module exports check
// ============================================================================

describe("module exports", () => {
  it("exports parseClinicianResponse from parser module", () => {
    expect(typeof parseClinicianResponse).toBe("function");
  });

  it("exports extractTime from parser module", () => {
    expect(typeof extractTime).toBe("function");
  });
});
