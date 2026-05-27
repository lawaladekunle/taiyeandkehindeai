/**
 * Twilio WhatsApp client wrapper for sending outbound messages.
 *
 * Uses the Twilio SDK to send text and media messages via the
 * Twilio WhatsApp Business API.
 */
import twilio from "twilio";
import type {
  WhatsAppClientConfig,
  SendMessageResult,
} from "./types";

export class WhatsAppClient {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor(config: WhatsAppClientConfig) {
    this.client = twilio(config.accountSid, config.authToken);
    this.fromNumber = config.fromNumber;
  }

  /**
   * Send a plain-text WhatsApp message.
   *
   * @param to - Recipient WhatsApp ID (e.g. "whatsapp:+2348012345678")
   * @param body - Message body text
   * @returns The message send result with SID and status
   */
  async sendTextMessage(
    to: string,
    body: string,
  ): Promise<SendMessageResult> {
    const message = await this.client.messages.create({
      from: this.fromNumber,
      to,
      body,
    });

    return {
      sid: message.sid,
      status: message.status,
      dateCreated: message.dateCreated,
    };
  }

  /**
   * Send a WhatsApp message with a media attachment (image, video, audio, document).
   *
   * @param to - Recipient WhatsApp ID
   * @param mediaUrl - Publicly accessible URL of the media file
   * @param caption - Optional caption for the media
   * @returns The message send result with SID and status
   */
  async sendMediaMessage(
    to: string,
    mediaUrl: string,
    caption?: string,
  ): Promise<SendMessageResult> {
    const message = await this.client.messages.create({
      from: this.fromNumber,
      to,
      mediaUrl: [mediaUrl],
      ...(caption ? { body: caption } : {}),
    });

    return {
      sid: message.sid,
      status: message.status,
      dateCreated: message.dateCreated,
    };
  }

  /**
   * Get the configured sender number.
   */
  getFromNumber(): string {
    return this.fromNumber;
  }
}

/**
 * Create a WhatsAppClient from environment variables.
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID  — Twilio Account SID
 *   TWILIO_AUTH_TOKEN   — Twilio Auth Token
 *   TWILIO_PHONE_NUMBER — Twilio WhatsApp sender number (e.g. "whatsapp:+14155238886")
 */
export function createWhatsAppClient(): WhatsAppClient {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      "Missing WhatsApp configuration: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER must be set",
    );
  }

  return new WhatsAppClient({ accountSid, authToken, fromNumber });
}
