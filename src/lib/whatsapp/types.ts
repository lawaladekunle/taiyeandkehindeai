/**
 * Shared types for WhatsApp integration.
 */

/** Supported incoming message types */
export type IncomingMessageType = "text" | "media" | "location" | "unknown";

/** Parsed incoming WhatsApp message from a Twilio webhook */
export interface IncomingMessage {
  /** WhatsApp ID of the sender (e.g. "whatsapp:+2348012345678") */
  from: string;
  /** WhatsApp ID of the recipient — our Twilio number (e.g. "whatsapp:+14155238886") */
  to: string;
  /** The type of message content */
  messageType: IncomingMessageType;
  /** Message body text (text messages only) */
  text?: string;
  /** URL of the media attachment (media messages only) */
  mediaUrl?: string;
  /** MIME type of the media (media messages only) */
  mediaContentType?: string;
  /** Latitude (location messages only) */
  latitude?: number;
  /** Longitude (location messages only) */
  longitude?: number;
  /** Twilio message SID for deduplication and tracking */
  messageSid: string;
  /** ISO 8601 timestamp from Twilio */
  timestamp: Date;
}

/** Configuration required for WhatsAppClient */
export interface WhatsAppClientConfig {
  accountSid: string;
  authToken: string;
  /** Twilio-provisioned WhatsApp sender number, e.g. "whatsapp:+14155238886" */
  fromNumber: string;
}

/** Result of a send operation */
export interface SendMessageResult {
  /** Twilio message SID */
  sid: string;
  /** Status returned by Twilio (queued, sent, failed, etc.) */
  status: string;
  /** ISO 8601 timestamp */
  dateCreated: Date;
}
