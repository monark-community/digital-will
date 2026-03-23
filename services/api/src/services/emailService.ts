import { Resend } from "resend";
import {
  NotificationType,
  NotificationRecipientRole,
} from "../substreams/interfaces/cleaned/model";
import {
  generateEmail,
  generateSignatureRequestInviteEmail,
} from "../utils/emailGenerator";
import { config } from "../config/config";
import { findUserById } from "./userService";

const resend = new Resend(config.email.apiKey);

// Resend free tier: max 5 requests/sec → enforce 210ms minimum between sends.
let lastEmailSentAt = 0;
const EMAIL_MIN_INTERVAL_MS = 210;

async function throttledSend(
  params: Parameters<typeof resend.emails.send>[0],
): Promise<Awaited<ReturnType<typeof resend.emails.send>>> {
  const gap = Date.now() - lastEmailSentAt;
  if (gap < EMAIL_MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, EMAIL_MIN_INTERVAL_MS - gap));
  }
  lastEmailSentAt = Date.now();
  return resend.emails.send(params);
}

export async function sendEmailNotification(
  type: NotificationType,
  willName: string,
  userId: string,
  role: NotificationRecipientRole = NotificationRecipientRole.SM,
): Promise<void> {
  const user = await findUserById(userId);
  if (!user || !user.wantToReceiveMails) return;

  const name = user.firstName + " " + user.lastName;
  const { subject, body } = generateEmail(type, willName, name, role);

  const { error } = await throttledSend({
    from: config.email.from,
    to: user.email,
    subject,
    html: body,
  });

  if (error) {
    console.error(
      `[EmailService] Failed to send "${subject}" to ${user.email}:`,
      error,
    );
  }
}

/**
 * Sends a SIGNATURE_REQUEST email directly to a secondary member's stored email
 * address, even if they do not yet have a WillChain account.
 */
export async function sendSignatureRequestToSm(
  willName: string,
  smFirstName: string,
  smLastName: string,
  smEmail: string,
): Promise<void> {
  const name = `${smFirstName} ${smLastName}`;
  const { subject, body } = generateSignatureRequestInviteEmail(willName, name);

  const { error } = await throttledSend({
    from: config.email.from,
    to: smEmail,
    subject,
    html: body,
  });

  if (error) {
    console.error(
      `[EmailService] Failed to send SIGNATURE_REQUEST to ${smEmail}:`,
      error,
    );
  }
}

export async function sendEmailNotifications(
  type: NotificationType,
  willName: string,
  userIds: string[],
  role: NotificationRecipientRole = NotificationRecipientRole.SM,
): Promise<void> {
  for (const userId of userIds) {
    await sendEmailNotification(type, willName, userId, role);
  }
}
