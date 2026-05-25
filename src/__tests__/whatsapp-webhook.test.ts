/**
 * Unit tests for webhook signature verification and message parsing.
 *
 * @jest-environment node
 */
import {
  verifyTwilioSignature,
  parseIncomingMessage,
} from "@/lib/whatsapp/webhook";

// Mock twilio.validateRequest
const mockValidateRequest = jest.fn();
jest.mock("twilio", () => ({
  validateRequest: (
    authToken: string,
    signature: string,
    url: string,
    params: Record<string, string>,
  ) => mockValidateRequest(authToken, signature, url, params),
}));

describe("verifyTwilioSignature", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true for a valid signature", () => {
    mockValidateRequest.mockReturnValue(true);

    const result = verifyTwilioSignature(
      "auth123",
      "abc123sig=",
      "https://example.com/api/webhooks/whatsapp",
      { Body: "Hello", From: "whatsapp:+123" },
    );

    expect(result).toBe(true);
    expect(mockValidateRequest).toHaveBeenCalledWith(
      "auth123",
      "abc123sig=",
      "https://example.com/api/webhooks/whatsapp",
      { Body: "Hello", From: "whatsapp:+123" },
    );
  });

  it("should return false for an invalid signature", () => {
    mockValidateRequest.mockReturnValue(false);

    const result = verifyTwilioSignature(
      "auth123",
      "bad-sig",
      "https://example.com/api/webhooks/whatsapp",
      { Body: "Hello" },
    );

    expect(result).toBe(false);
  });
});

describe("parseIncomingMessage", () => {
  describe("text messages", () => {
    it("should parse a plain text message", () => {
      const body = {
        MessageSid: "SM123",
        From: "whatsapp:+2348012345678",
        To: "whatsapp:+14155238886",
        Body: "Hello doctor",
        NumMedia: "0",
      };

      const result = parseIncomingMessage(body);

      expect(result.messageType).toBe("text");
      expect(result.from).toBe("whatsapp:+2348012345678");
      expect(result.to).toBe("whatsapp:+14155238886");
      expect(result.text).toBe("Hello doctor");
      expect(result.messageSid).toBe("SM123");
    });

    it("should handle empty body text", () => {
      const body = {
        MessageSid: "SM124",
        From: "whatsapp:+2348012345678",
        To: "whatsapp:+14155238886",
        Body: "",
        NumMedia: "0",
      };

      const result = parseIncomingMessage(body);

      expect(result.messageType).toBe("unknown");
      expect(result.text).toBe("");
    });
  });

  describe("media messages", () => {
    it("should parse an image message", () => {
      const body = {
        MessageSid: "SM200",
        From: "whatsapp:+2348012345678",
        To: "whatsapp:+14155238886",
        NumMedia: "1",
        MediaUrl0: "https://api.twilio.com/media/IMG123.jpg",
        MediaContentType0: "image/jpeg",
        Body: "",
      };

      const result = parseIncomingMessage(body);

      expect(result.messageType).toBe("media");
      expect(result.mediaUrl).toBe("https://api.twilio.com/media/IMG123.jpg");
      expect(result.mediaContentType).toBe("image/jpeg");
    });

    it("should include caption text when a media message has a body", () => {
      const body = {
        MessageSid: "SM201",
        From: "whatsapp:+2348012345678",
        To: "whatsapp:+14155238886",
        NumMedia: "1",
        MediaUrl0: "https://api.twilio.com/media/IMG456.jpg",
        MediaContentType0: "image/png",
        Body: "Here is the lab result",
      };

      const result = parseIncomingMessage(body);

      expect(result.messageType).toBe("media");
      expect(result.mediaUrl).toBe("https://api.twilio.com/media/IMG456.jpg");
      expect(result.text).toBe("Here is the lab result");
    });

    it("should handle multiple media attachments (only first parsed)", () => {
      const body = {
        MessageSid: "SM202",
        From: "whatsapp:+2348012345678",
        To: "whatsapp:+14155238886",
        NumMedia: "2",
        MediaUrl0: "https://api.twilio.com/media/first.jpg",
        MediaContentType0: "image/jpeg",
        MediaUrl1: "https://api.twilio.com/media/second.jpg",
        MediaContentType1: "image/jpeg",
      };

      const result = parseIncomingMessage(body);

      expect(result.messageType).toBe("media");
      expect(result.mediaUrl).toBe("https://api.twilio.com/media/first.jpg");
    });
  });

  describe("location messages", () => {
    it("should parse a location share", () => {
      const body = {
        MessageSid: "SM300",
        From: "whatsapp:+2348012345678",
        To: "whatsapp:+14155238886",
        Latitude: "6.5244",
        Longitude: "3.3792",
        Body: "My clinic location",
        NumMedia: "0",
      };

      const result = parseIncomingMessage(body);

      expect(result.messageType).toBe("location");
      expect(result.latitude).toBe(6.5244);
      expect(result.longitude).toBe(3.3792);
      expect(result.text).toBe("My clinic location");
    });

    it("should classify location even without body text", () => {
      const body = {
        MessageSid: "SM301",
        From: "whatsapp:+2348012345678",
        To: "whatsapp:+14155238886",
        Latitude: "6.5244",
        Longitude: "3.3792",
        NumMedia: "0",
      };

      const result = parseIncomingMessage(body);

      expect(result.messageType).toBe("location");
      expect(result.latitude).toBe(6.5244);
      expect(result.longitude).toBe(3.3792);
    });
  });

  describe("edge cases", () => {
    it("should handle missing From/To fields gracefully", () => {
      const body = {
        MessageSid: "SM400",
        Body: "test",
      };

      const result = parseIncomingMessage(body);

      expect(result.from).toBe("unknown");
      expect(result.to).toBe("unknown");
    });

    it("should fall back to SmsMessageSid for messageSid", () => {
      const body = {
        SmsMessageSid: "SMS999",
        From: "whatsapp:+123",
        Body: "hello",
      };

      const result = parseIncomingMessage(body);

      expect(result.messageSid).toBe("SMS999");
    });

    it("should classify as unknown when no known fields are present", () => {
      const body: Record<string, string> = {
        MessageSid: "SM500",
        From: "whatsapp:+123",
        To: "whatsapp:+456",
      };

      const result = parseIncomingMessage(body);

      expect(result.messageType).toBe("unknown");
    });
  });
});
