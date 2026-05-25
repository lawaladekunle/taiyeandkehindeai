/**
 * Unit tests for WhatsAppClient (Twilio wrapper).
 *
 * @jest-environment node
 */
import { WhatsAppClient, createWhatsAppClient } from "@/lib/whatsapp/client";

// Mock the twilio module
const mockCreate = jest.fn();
jest.mock("twilio", () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
    },
  }));
});

describe("WhatsAppClient", () => {
  const config = {
    accountSid: "AC123",
    authToken: "token123",
    fromNumber: "whatsapp:+14155238886",
  };

  let client: WhatsAppClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new WhatsAppClient(config);
  });

  describe("constructor", () => {
    it("should create a Twilio client with the provided credentials", () => {
      expect(client).toBeInstanceOf(WhatsAppClient);
    });

    it("should expose the sender number", () => {
      expect(client.getFromNumber()).toBe("whatsapp:+14155238886");
    });
  });

  describe("sendTextMessage", () => {
    it("should send a text message and return the result", async () => {
      mockCreate.mockResolvedValueOnce({
        sid: "SM123",
        status: "queued",
        dateCreated: new Date("2025-01-01T00:00:00Z"),
      });

      const result = await client.sendTextMessage(
        "whatsapp:+2348012345678",
        "Hello from test",
      );

      expect(mockCreate).toHaveBeenCalledWith({
        from: "whatsapp:+14155238886",
        to: "whatsapp:+2348012345678",
        body: "Hello from test",
      });
      expect(result).toEqual({
        sid: "SM123",
        status: "queued",
        dateCreated: new Date("2025-01-01T00:00:00Z"),
      });
    });

    it("should propagate Twilio API errors", async () => {
      mockCreate.mockRejectedValueOnce(new Error("Twilio API error"));

      await expect(
        client.sendTextMessage("whatsapp:+2348012345678", "test"),
      ).rejects.toThrow("Twilio API error");
    });
  });

  describe("sendMediaMessage", () => {
    it("should send a media message with a URL", async () => {
      mockCreate.mockResolvedValueOnce({
        sid: "SM456",
        status: "queued",
        dateCreated: new Date("2025-01-01T00:00:00Z"),
      });

      const result = await client.sendMediaMessage(
        "whatsapp:+2348012345678",
        "https://example.com/image.jpg",
      );

      expect(mockCreate).toHaveBeenCalledWith({
        from: "whatsapp:+14155238886",
        to: "whatsapp:+2348012345678",
        mediaUrl: ["https://example.com/image.jpg"],
      });
      expect(result.sid).toBe("SM456");
    });

    it("should send a media message with a caption", async () => {
      mockCreate.mockResolvedValueOnce({
        sid: "SM789",
        status: "sent",
        dateCreated: new Date("2025-01-01T00:00:00Z"),
      });

      const result = await client.sendMediaMessage(
        "whatsapp:+2348012345678",
        "https://example.com/doc.pdf",
        "Check this document",
      );

      expect(mockCreate).toHaveBeenCalledWith({
        from: "whatsapp:+14155238886",
        to: "whatsapp:+2348012345678",
        mediaUrl: ["https://example.com/doc.pdf"],
        body: "Check this document",
      });
      expect(result.status).toBe("sent");
    });
  });
});

describe("createWhatsAppClient", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("should create a client from environment variables", () => {
    process.env.TWILIO_ACCOUNT_SID = "AC_ENV";
    process.env.TWILIO_AUTH_TOKEN = "token_env";
    process.env.TWILIO_PHONE_NUMBER = "whatsapp:+1234567890";

    const c = createWhatsAppClient();
    expect(c).toBeInstanceOf(WhatsAppClient);
    expect(c.getFromNumber()).toBe("whatsapp:+1234567890");
  });

  it("should throw if TWILIO_ACCOUNT_SID is missing", () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    process.env.TWILIO_AUTH_TOKEN = "token_env";
    process.env.TWILIO_PHONE_NUMBER = "whatsapp:+1234567890";

    expect(() => createWhatsAppClient()).toThrow(
      "Missing WhatsApp configuration",
    );
  });

  it("should throw if TWILIO_AUTH_TOKEN is missing", () => {
    process.env.TWILIO_ACCOUNT_SID = "AC_ENV";
    delete process.env.TWILIO_AUTH_TOKEN;
    process.env.TWILIO_PHONE_NUMBER = "whatsapp:+1234567890";

    expect(() => createWhatsAppClient()).toThrow(
      "Missing WhatsApp configuration",
    );
  });

  it("should throw if TWILIO_PHONE_NUMBER is missing", () => {
    process.env.TWILIO_ACCOUNT_SID = "AC_ENV";
    process.env.TWILIO_AUTH_TOKEN = "token_env";
    delete process.env.TWILIO_PHONE_NUMBER;

    expect(() => createWhatsAppClient()).toThrow(
      "Missing WhatsApp configuration",
    );
  });
});
