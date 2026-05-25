/**
 * Next.js App Router route handler for Twilio WhatsApp webhooks.
 *
 * POST /api/webhooks/whatsapp
 *
 * Verifies the Twilio request signature, parses the incoming message,
 * and returns a TwiML response (empty for now — conversation routing
 * will be added in a later phase).
 */
import { NextResponse } from "next/server";
import {
  verifyTwilioSignature,
  parseIncomingMessage,
} from "@/lib/whatsapp/webhook";

/**
 * Handle incoming WhatsApp messages from Twilio.
 *
 * Twilio sends POST requests with form-encoded body and an
 * X-Twilio-Signature header for verification.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!authToken) {
    console.error("TWILIO_AUTH_TOKEN not configured");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  // Read the raw body as text for signature verification
  const bodyText = await request.text();

  // Build the full URL Twilio delivered to
  // Use nextUrl when available (Next.js App Router), fall back to standard Request.url
  const url =
    "nextUrl" in request && request.nextUrl
      ? request.nextUrl.toString()
      : request.url;

  // Signature from header
  const signature = request.headers.get("x-twilio-signature") ?? "";

  // Parse body into key-value pairs
  const params = new URLSearchParams(bodyText);
  const bodyParams: Record<string, string> = {};
  params.forEach((value, key) => {
    bodyParams[key] = value;
  });

  // Verify the request came from Twilio
  const isValid = verifyTwilioSignature(authToken, signature, url, bodyParams);

  if (!isValid) {
    console.warn("Invalid Twilio signature on webhook request");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 403 },
    );
  }

  // Parse the incoming message
  const message = parseIncomingMessage(bodyParams);

  console.log("Received WhatsApp message:", {
    from: message.from,
    type: message.messageType,
    sid: message.messageSid,
  });

  // TODO: Route to conversation handler (TAI-26)
  // For now, return an empty TwiML response to acknowledge receipt

  return new NextResponse("<Response></Response>", {
    status: 200,
    headers: {
      "Content-Type": "text/xml",
    },
  });
}

/**
 * Reject non-POST requests to the webhook endpoint.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "This endpoint only accepts POST requests from Twilio" },
    { status: 405 },
  );
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 },
  );
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 },
  );
}

export async function PATCH(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 },
  );
}
