/**
 * Unit tests for the /api/cron/reminders route and reminder templates.
 *
 * @jest-environment node
 */

// ── Mocks (must be before imports) ──────────────────────────────────────────

const mockSendTextMessage = jest.fn();

jest.mock("@/lib/whatsapp/client", () => ({
  createWhatsAppClient: () => ({ sendTextMessage: mockSendTextMessage }),
}));

const mockFindManyAppointments = jest.fn();
const mockCreateReminder = jest.fn();
const mockUpdateReminder = jest.fn();
const mockUpdateAppointment = jest.fn();
const mockTransaction = jest.fn();

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    appointment: {
      findMany: mockFindManyAppointments,
      update: mockUpdateAppointment,
    },
    reminder: {
      create: mockCreateReminder,
      update: mockUpdateReminder,
    },
    $transaction: mockTransaction,
  })),
}));

import { POST } from "@/app/api/cron/reminders/route";
import {
  build24hReminderMessage,
  buildMissedAppointmentMessage,
} from "@/lib/reminders/templates";

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeAppointment(overrides: Record<string, unknown> = {}) {
  return {
    id: "appt-1",
    patientId: "pat-1",
    clinicianId: "clin-1",
    scheduledAt: new Date("2026-06-03T10:00:00Z"),
    durationMin: 30,
    status: "pending",
    reason: "Checkup",
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    reminders: [],
    patient: {
      id: "pat-1",
      phoneNumber: "+2348012345678",
      name: "Amina",
      preferredName: "Amina",
      language: "en",
      timezone: "Africa/Lagos",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    clinician: {
      id: "clin-1",
      phoneNumber: "+2348087654321",
      name: "Dr. Bello",
      specialty: "General Practice",
      availability: null,
      maxDailyAppts: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    ...overrides,
  };
}

function makeRequest(opts: { secret?: string } = {}) {
  const headers: Record<string, string> = {};
  if (opts.secret !== undefined) headers["x-cron-secret"] = opts.secret;
  return new Request("https://example.com/api/cron/reminders", {
    method: "POST",
    headers,
  });
}

// ── Template tests ────────────────────────────────────────────────────────────

describe("build24hReminderMessage", () => {
  it("includes patient name, clinician name, and confirm/cancel instructions", () => {
    const appt = makeAppointment();
    const msg = build24hReminderMessage(appt as Parameters<typeof build24hReminderMessage>[0]);
    expect(msg).toContain("Amina");
    expect(msg).toContain("Dr. Bello");
    expect(msg).toContain("CONFIRM");
    expect(msg).toContain("CANCEL");
    expect(msg).toContain("Checkup");
  });

  it("uses preferredName when available", () => {
    const appt = makeAppointment({ patient: { ...makeAppointment().patient, preferredName: "Ami" } });
    const msg = build24hReminderMessage(appt as Parameters<typeof build24hReminderMessage>[0]);
    expect(msg).toContain("Ami");
  });

  it("falls back gracefully when no patient name or reason", () => {
    const appt = makeAppointment({
      reason: null,
      patient: { ...makeAppointment().patient, name: null, preferredName: null },
    });
    const msg = build24hReminderMessage(appt as Parameters<typeof build24hReminderMessage>[0]);
    expect(msg).toContain("there");
    expect(msg).not.toContain("undefined");
  });
});

describe("buildMissedAppointmentMessage", () => {
  it("includes patient name and RESCHEDULE instruction", () => {
    const appt = makeAppointment();
    const msg = buildMissedAppointmentMessage(appt as Parameters<typeof buildMissedAppointmentMessage>[0]);
    expect(msg).toContain("Amina");
    expect(msg).toContain("RESCHEDULE");
    expect(msg).toContain("missed");
  });
});

// ── Route tests ───────────────────────────────────────────────────────────────

describe("POST /api/cron/reminders", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, CRON_SECRET: "test-secret" };
    mockCreateReminder.mockResolvedValue({ id: "rem-1" });
    mockUpdateReminder.mockResolvedValue({});
    mockUpdateAppointment.mockResolvedValue({});
    mockTransaction.mockResolvedValue([]);
    mockSendTextMessage.mockResolvedValue({ sid: "SM123", status: "queued", dateCreated: new Date() });
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("returns 401 when CRON_SECRET is missing", async () => {
    delete process.env.CRON_SECRET;
    mockFindManyAppointments.mockResolvedValue([]);
    const res = await POST(makeRequest({ secret: "anything" }) as Parameters<typeof POST>[0]);
    expect(res.status).toBe(401);
  });

  it("returns 401 when secret header is wrong", async () => {
    mockFindManyAppointments.mockResolvedValue([]);
    const res = await POST(makeRequest({ secret: "wrong" }) as Parameters<typeof POST>[0]);
    expect(res.status).toBe(401);
  });

  it("returns 401 when secret header is absent", async () => {
    mockFindManyAppointments.mockResolvedValue([]);
    const res = await POST(makeRequest() as Parameters<typeof POST>[0]);
    expect(res.status).toBe(401);
  });

  it("sends reminders for upcoming appointments and returns ok", async () => {
    const appt = makeAppointment();
    // First call = upcoming, second call = missed
    mockFindManyAppointments
      .mockResolvedValueOnce([appt])
      .mockResolvedValueOnce([]);

    const res = await POST(makeRequest({ secret: "test-secret" }) as Parameters<typeof POST>[0]);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.reminders.sent).toBe(1);
    expect(mockSendTextMessage).toHaveBeenCalledWith(
      "whatsapp:+2348012345678",
      expect.stringContaining("CONFIRM"),
    );
  });

  it("marks reminder failed when WhatsApp send throws", async () => {
    const appt = makeAppointment();
    mockFindManyAppointments
      .mockResolvedValueOnce([appt])
      .mockResolvedValueOnce([]);
    mockSendTextMessage.mockRejectedValueOnce(new Error("Twilio error"));

    const res = await POST(makeRequest({ secret: "test-secret" }) as Parameters<typeof POST>[0]);
    const body = await res.json();

    expect(body.reminders.results[0].status).toBe("failed");
    expect(body.reminders.results[0].error).toContain("Twilio error");
  });

  it("sends missed-appointment follow-ups for past unconfirmed appointments", async () => {
    const missedAppt = makeAppointment({
      scheduledAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      status: "pending",
      reminders: [],
    });
    mockFindManyAppointments
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([missedAppt]);

    const res = await POST(makeRequest({ secret: "test-secret" }) as Parameters<typeof POST>[0]);
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(body.loopback.sent).toBe(1);
    expect(mockSendTextMessage).toHaveBeenCalledWith(
      "whatsapp:+2348012345678",
      expect.stringContaining("RESCHEDULE"),
    );
  });

  it("returns ok with zeros when no appointments need action", async () => {
    mockFindManyAppointments.mockResolvedValue([]);

    const res = await POST(makeRequest({ secret: "test-secret" }) as Parameters<typeof POST>[0]);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.reminders.sent).toBe(0);
    expect(body.loopback.sent).toBe(0);
  });
});
