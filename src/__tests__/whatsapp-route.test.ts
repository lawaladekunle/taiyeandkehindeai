/**
 * Unit tests for the WhatsApp webhook API route handler.
 *
 * Tests signature verification gating, message parsing, and HTTP method
 * handling using Next.js App Router conventions.
 *
 * @jest-environment node
 */

// Must mock modules before any imports that use them
const mockVerify = jest.fn();
const mockParse = jest.fn();

jest.mock("@/lib/whatsapp/webhook", () => ({
  verifyTwilioSignature: (
    authToken: string,
    signature: string,
    url: string,
    params: Record<string, string>,
  ) => mockVerify(authToken, signature, url, params),
  parseIncomingMessage: (body: Record<string, string>) => mockParse(body),
}));

import { POST, GET, PUT, DELETE, PATCH } from "@/app/api/webhooks/whatsapp/route";

// Helper: create a mock NextRequest with form-encoded body
function createRequest(
  body: Record<string, string>,
  opts?: { signature?: string; url?: string },
): Request {
  const params = new URLSearchParams(body);
  const url = opts?.url ?? "https://example.com/api/webhooks/whatsapp";
  const headers: Record<string, string> = {
    "content-type": "application/x-www-form-urlencoded",
  };
  if (opts?.signature) {
    headers["x-twilio-signature"] = opts.signature;
  }

  return new Request(url, {
    method: "POST",
    headers,
    body: params.toString(),
  });
}

describe("POST /api/webhooks/whatsapp", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, TWILIO_AUTH_TOKEN: "test-auth-token" };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("should return 500 if TWILIO_AUTH_TOKEN is not configured", async () => {
    delete process.env.TWILIO_AUTH_TOKEN;

    const req = createRequest({ Body: "Hello" });
    const response = await POST(req as unknown as Request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Server configuration error");
  });

  it("should return 403 for invalid Twilio signature", async () => {
    mockVerify.mockReturnValue(false);

    const req = createRequest(
      { Body: "Hello", From: "whatsapp:+123" },
      { signature: "bad-sig" },
    );
    const response = await POST(req as unknown as Request);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Invalid signature");
  });

  it("should return 200 TwiML for valid text messages", async () => {
    mockVerify.mockReturnValue(true);
    mockParse.mockReturnValue({
      from: "whatsapp:+2348012345678",
      to: "whatsapp:+14155238886",
      messageType: "text",
      messageSid: "SM123",
      text: "Hello doctor",
      timestamp: new Date(),
    });

    const req = createRequest(
      {
        Body: "Hello doctor",
        From: "whatsapp:+2348012345678",
        To: "whatsapp:+14155238886",
        MessageSid: "SM123",
      },
      {
        signature: "valid-signature",
        url: "https://example.com/api/webhooks/whatsapp",
      },
    );
    const response = await POST(req as unknown as Request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/xml");
    const body = await response.text();
    expect(body).toBe("<Response></Response>");
  });

  it("should return 200 for media messages", async () => {
    mockVerify.mockReturnValue(true);
    mockParse.mockReturnValue({
      from: "whatsapp:+2348012345678",
      to: "whatsapp:+14155238886",
      messageType: "media",
      messageSid: "SM200",
      mediaUrl: "https://example.com/img.jpg",
      mediaContentType: "image/jpeg",
      timestamp: new Date(),
    });

    const req = createRequest({
      NumMedia: "1",
      MediaUrl0: "https://example.com/img.jpg",
      MediaContentType0: "image/jpeg",
      From: "whatsapp:+2348012345678",
      MessageSid: "SM200",
    });
    const response = await POST(req as unknown as Request);

    expect(response.status).toBe(200);
  });

  it("should return 200 for location messages", async () => {
    mockVerify.mockReturnValue(true);
    mockParse.mockReturnValue({
      from: "whatsapp:+2348012345678",
      to: "whatsapp:+14155238886",
      messageType: "location",
      messageSid: "SM300",
      latitude: 6.5244,
      longitude: 3.3792,
      timestamp: new Date(),
    });

    const req = createRequest({
      Latitude: "6.5244",
      Longitude: "3.3792",
      From: "whatsapp:+2348012345678",
      MessageSid: "SM300",
    });
    const response = await POST(req as unknown as Request);

    expect(response.status).toBe(200);
  });
});

describe("Non-POST methods", () => {
  it("GET should return 405", async () => {
    const response = await GET();
    expect(response.status).toBe(405);
    const body = await response.json();
    expect(body.error).toContain("POST");
  });

  it("PUT should return 405", async () => {
    const response = await PUT();
    expect(response.status).toBe(405);
  });

  it("DELETE should return 405", async () => {
    const response = await DELETE();
    expect(response.status).toBe(405);
  });

  it("PATCH should return 405", async () => {
    const response = await PATCH();
    expect(response.status).toBe(405);
  });
});
