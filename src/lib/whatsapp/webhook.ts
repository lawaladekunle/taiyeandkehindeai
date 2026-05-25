/**
 * Twilio WhatsApp webhook verification and incoming message parsing.
 *
 * Verifies the X-Twilio-Signature header on incoming webhooks and
 * parses the raw form-encoded body into a structured IncomingMessage.
 */
import twilio from "twilio";
import type { IncomingMessage, IncomingMessageType } from "./types";

/**
 * Verify that an incoming webhook request genuinely originated from Twilio.
 *
 * Uses Twilio's HMAC-SHA1 signature scheme: the auth token is used to sign
 * the full request URL concatenated with sorted POST parameters.
 *
 * @param authToken  - Twilio Auth Token for the account
 * @param signature  - Value of the X-Twilio-Signature header
 * @param url        - Full URL the webhook was delivered to (protocol + host + path)
 * @param params     - Parsed POST body parameters (as key-value pairs)
 * @returns true if the signature is valid
 */
export function verifyTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>,
): boolean {
  return twilio.validateRequest(authToken, signature, url, params);
}

/**
 * Parse the raw webhook body into a structured IncomingMessage.
 *
 * Handles text, media (image/video/audio/document), and location messages
 * per the Twilio WhatsApp webhook specification.
 *
 * @param body - Parsed form-encoded webhook body
 * @returns Structured incoming message
 */
export function parseIncomingMessage(
  body: Record<string, string>,
): IncomingMessage {
  const messageType = classifyMessage(body);

  const message: IncomingMessage = {
    from: body.From ?? "unknown",
    to: body.To ?? "unknown",
    messageType,
    messageSid: body.MessageSid ?? body.SmsMessageSid ?? "unknown",
    timestamp: new Date(),
  };

  switch (messageType) {
    case "text":
      message.text = body.Body ?? "";
      break;

    case "media": {
      const numMedia = parseInt(body.NumMedia ?? "0", 10);
      if (numMedia > 0) {
        message.mediaUrl = body.MediaUrl0 ?? undefined;
        message.mediaContentType = body.MediaContentType0 ?? undefined;
        // Include the caption as text if present
        if (body.Body) {
          message.text = body.Body;
        }
      }
      break;
    }

    case "location":
      message.latitude = parseFloat(body.Latitude ?? "0");
      message.longitude = parseFloat(body.Longitude ?? "0");
      if (body.Body) {
        message.text = body.Body;
      }
      break;

    default:
      // Unknown types — preserve whatever body text may exist
      message.text = body.Body ?? "";
      break;
  }

  return message;
}

/**
 * Classify an incoming message based on its webhook fields.
 */
function classifyMessage(body: Record<string, string>): IncomingMessageType {
  const numMedia = parseInt(body.NumMedia ?? "0", 10);

  if (numMedia > 0) {
    return "media";
  }

  if (body.Latitude && body.Longitude) {
    return "location";
  }

  if (body.Body !== undefined && body.Body !== "") {
    return "text";
  }

  return "unknown";
}
