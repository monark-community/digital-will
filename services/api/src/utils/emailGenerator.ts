import {
  NotificationType,
  NotificationRecipientRole,
} from "../substreams/interfaces/cleaned/model";
import { config } from "../config/config";

export { NotificationRecipientRole };
export type EmailRecipientRole = NotificationRecipientRole;

export interface EmailContent {
  subject: string;
  body: string;
}

type TemplateArgs = {
  willName: string;
  recipientName: string;
  role: NotificationRecipientRole;
  smName?: string;
};

const LOGIN_URL = `${config.webUrl}/login`;
const SIGNUP_URL = `${config.webUrl}/signup`;
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Wraps content lines in the standard WillChain HTML email layout.
 * Colors match the WillChain site theme: dark navy bg + green accent.
 * @param recipientName - Full name of the recipient.
 * @param contentHtml   - Inner HTML content (paragraphs, lists, etc.).
 * @param ctaLabel      - Label for the call-to-action button.
 */
function buildEmail(
  recipientName: string,
  contentHtml: string,
  ctaLabel: string = "Access My Account",
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WillChain Notification</title>
</head>
<body style="margin:0;padding:0;background-color:#0a192f;font-family:Inter,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a192f;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#172a45;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.4);border:1px solid #2d4a6f;">

          <!-- ── Header ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#0a192f 0%,#172a45 60%,#1e3a5f 100%);padding:40px 48px;text-align:center;border-bottom:1px solid #2d4a6f;">
              <p style="margin:0 0 6px;color:#9ca3af;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">Secure Digital Legacy</p>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:1px;">WillChain</h1>
              <div style="margin-top:16px;width:48px;height:3px;background-color:#22c55e;border-radius:2px;display:inline-block;"></div>
            </td>
          </tr>

          <!-- ── Greeting ── -->
          <tr>
            <td style="padding:40px 48px 0;">
              <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">Dear ${recipientName},</p>
            </td>
          </tr>

          <!-- ── Content ── -->
          <tr>
            <td style="padding:24px 48px 0;color:#d1d5db;font-size:15px;line-height:1.8;">
              ${contentHtml}
            </td>
          </tr>

          <!-- ── CTA Button ── -->
          <tr>
            <td style="padding:36px 48px;text-align:center;">
              <a href="${LOGIN_URL}"
                 style="display:inline-block;background-color:#22c55e;color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(34,197,94,0.35);">
                ${ctaLabel} &rarr;
              </a>
              <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
                Or copy this link into your browser:<br />
                <a href="${LOGIN_URL}" style="color:#22c55e;word-break:break-all;">${LOGIN_URL}</a>
              </p>
            </td>
          </tr>

          <!-- ── Divider ── -->
          <tr>
            <td style="padding:0 48px;">
              <div style="border-top:1px solid #2d4a6f;"></div>
            </td>
          </tr>

          <!-- ── Closing ── -->
          <tr>
            <td style="padding:32px 48px 0;color:#d1d5db;font-size:15px;line-height:1.8;">
              <p style="margin:0;">
                If you have any questions or concerns regarding this notification, please do not hesitate to
                contact our support team. We are committed to ensuring the security and integrity of your
                digital legacy.
              </p>
              <p style="margin:20px 0 0;">
                Yours sincerely,<br />
                <strong style="color:#ffffff;">The WillChain Team</strong><br />
                <span style="color:#9ca3af;font-size:13px;">Secure Digital Legacy Management</span>
              </p>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="background-color:#0a192f;padding:28px 48px;margin-top:32px;border-top:1px solid #2d4a6f;">
              <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.7;text-align:center;">
                This message was sent to you because you hold an active account on WillChain or are
                a designated participant in a registered digital will. If you believe you have received
                this email in error, please disregard it or contact our support team.<br /><br />
                &copy; ${CURRENT_YEAR} WillChain &mdash; All rights reserved.<br />
                WillChain is a secure blockchain-based platform for digital legacy management.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const templates: Record<
  NotificationType,
  (args: TemplateArgs) => EmailContent
> = {
  [NotificationType.WILL_ACTIVATED]: ({ willName, recipientName, role }) =>
    role === NotificationRecipientRole.PM
      ? {
          subject: `WillChain — Your will "${willName}" is now active`,
          body: buildEmail(
            recipientName,
            `<p>We are pleased to inform you that your digital will <strong>"${willName}"</strong> is now officially
            <strong style="color:#16a34a;">active on the blockchain</strong>.</p>
            <p>All designated secondary members have successfully reviewed and validated their participation.
            Your digital legacy is now secured and will be executed in accordance with the terms you defined.</p>
            <p>You can log in to your WillChain account at any time to review the status of your will, manage
            your secondary members, or update your asset allocations.</p>`,
            "View My Will",
          ),
        }
      : {
          subject: `WillChain — The will "${willName}" is now active`,
          body: buildEmail(
            recipientName,
            `<p>We are pleased to inform you that the digital will <strong>"${willName}"</strong>, in which you are
            a designated participant, is now officially <strong style="color:#16a34a;">active on the blockchain</strong>.</p>
            <p>All participants have successfully validated their participation, and the will is now fully
            operational. Your role and associated assets are secured as defined by the will owner.</p>
            <p>You can log in to your WillChain account to review the details of your participation and
            stay informed about any future updates.</p>`,
            "View Will Details",
          ),
        },

  [NotificationType.WILL_CANCELED]: ({ willName, recipientName }) => ({
    subject: `WillChain — The will "${willName}" has been canceled`,
    body: buildEmail(
      recipientName,
      `<p>We are writing to inform you that the digital will <strong>"${willName}"</strong>, in which you were
      a designated participant, has been <strong style="color:#dc2626;">officially canceled</strong> by its owner.</p>
      <p>As a result, all obligations and allocations associated with this will are now void. You will no longer
      receive notifications related to this will.</p>
      <p>If you have any questions regarding this cancellation or believe this was done in error, we encourage
      you to contact the will owner directly or reach out to our support team.</p>`,
      "Go to My Account",
    ),
  }),

  [NotificationType.WILL_CANCELED_ALL_SM_LEFT]: ({
    willName,
    recipientName,
  }) => ({
    subject: `WillChain — Your will "${willName}" has been automatically canceled`,
    body: buildEmail(
      recipientName,
      `<p>We are writing to inform you that your digital will <strong>"${willName}"</strong> has been
      <strong style="color:#dc2626;">automatically canceled</strong> because all designated secondary members
      have left the will.</p>
      <p>Without any secondary members, the will cannot be executed. You can create a new will and designate
      new secondary members at any time from your dashboard.</p>`,
      "Go to My Dashboard",
    ),
  }),

  [NotificationType.SIGNATURE_REQUEST]: ({ willName, recipientName }) => ({
    subject: `WillChain — Action Required: You have been added to the will "${willName}"`,
    body: buildEmail(
      recipientName,
      `<p>You have been designated as a <strong>secondary member</strong> of the digital will
      <strong>"${willName}"</strong> on WillChain.</p>
      <p>As a secondary member, you play an important role in the execution of this digital legacy.
      Your participation must be formally validated before the will can become active on the blockchain.</p>
      <p><strong>Action required:</strong> Please log in to your WillChain account to review the full
      details of your participation — including your designated assets and responsibilities — and confirm
      your involvement. The will cannot be activated until all secondary members have completed this step.</p>
      <p>If you do not have a WillChain account yet, you will be prompted to create one upon following
      the link below.</p>`,
      "Review &amp; Validate My Participation",
    ),
  }),

  [NotificationType.SM_ADDED]: ({ willName, recipientName, role, smName }) => {
    const name = smName ?? "A secondary member";
    return role === NotificationRecipientRole.PM
      ? {
          subject: `WillChain — A member validated their participation in "${willName}"`,
          body: buildEmail(
            recipientName,
            `<p>Good news! <strong>${name}</strong> has successfully validated their participation in your digital will <strong>"${willName}"</strong>.</p>
            <p>The overall status of your will has been updated accordingly. Once all designated secondary
            members have completed their validation, your will shall be automatically activated on the
            blockchain.</p>
            <p>Please log in to your account to review the current validation progress and see which
            members have confirmed their participation.</p>`,
            "Check Validation Progress",
          ),
        }
      : {
          subject: `WillChain — A new member joined the will "${willName}"`,
          body: buildEmail(
            recipientName,
            `<p><strong>${name}</strong> has successfully validated their participation in the digital will <strong>"${willName}"</strong>.</p>
            <p>The will is progressing towards full activation. Once all participants have confirmed their
            involvement, the will shall become active on the blockchain.</p>
            <p>You can log in to your WillChain account to view the updated participant list and monitor
            the activation status.</p>`,
            "View Will Status",
          ),
        };
  },

  [NotificationType.SM_UPDATED]: ({ willName, recipientName, role }) =>
    role === NotificationRecipientRole.SM_TARGET
      ? {
          subject: `WillChain — Your participation in "${willName}" has been updated`,
          body: buildEmail(
            recipientName,
            `<p>We are writing to inform you that the details of your participation in the digital will
            <strong>"${willName}"</strong> have been <strong>updated by the will owner</strong>.</p>
            <p>This may include changes to your designated asset allocations, your role within the will,
            or other participation parameters. We recommend reviewing these changes carefully to ensure
            you are fully aware of your current responsibilities.</p>
            <p>Please log in to your WillChain account to consult the updated terms of your participation.</p>`,
            "Review My Updated Participation",
          ),
        }
      : {
          subject: `WillChain — A member's participation in "${willName}" was updated`,
          body: buildEmail(
            recipientName,
            `<p>We are writing to inform you that the participation details of a secondary member in the
            digital will <strong>"${willName}"</strong> have been updated by the will owner.</p>
            <p>The overall structure of the will may have changed as a result. You can log in to your
            WillChain account to view the latest state of the will and its participants.</p>`,
            "View Will Details",
          ),
        },

  [NotificationType.SM_REMOVED]: ({
    willName,
    recipientName,
    role,
    smName,
  }) => {
    const name = smName ?? "A secondary member";
    return role === NotificationRecipientRole.SM_TARGET
      ? {
          subject: `WillChain — You have been removed from the will "${willName}"`,
          body: buildEmail(
            recipientName,
            `<p>We are writing to inform you that you have been <strong>removed from the digital will
            <strong>"${willName}"</strong></strong> by its owner.</p>
            <p>Effective immediately, you are no longer a designated participant in this will, and your
            associated asset allocations have been revoked. You will not receive any further notifications
            related to this will.</p>
            <p>If you believe this removal was made in error, please contact the will owner directly or
            reach out to our support team for assistance.</p>`,
            "Go to My Account",
          ),
        }
      : {
          subject: `WillChain — A member was removed from "${willName}"`,
          body: buildEmail(
            recipientName,
            `<p><strong>${name}</strong> has been removed from the digital will
            <strong>"${willName}"</strong> by its owner.</p>
            <p>The structure of the will has been updated accordingly. You can log in to your WillChain
            account to review the current list of participants and the updated will configuration.</p>`,
            "View Will Details",
          ),
        };
  },

  [NotificationType.SM_DESISTED]: ({
    willName,
    recipientName,
    role,
    smName,
  }) => {
    const name = smName ?? "A secondary member";
    return role === NotificationRecipientRole.PM
      ? {
          subject: `WillChain — A secondary member desisted from "${willName}"`,
          body: buildEmail(
            recipientName,
            `<p><strong>${name}</strong> has <strong>withdrawn their participation</strong>
            from your digital will <strong>"${willName}"</strong>.</p>
            <p>As a result, the will cannot be activated until the vacant position is filled by a new
            secondary member. We recommend logging in to your WillChain account promptly to review the
            current status and, if necessary, designate a replacement participant.</p>
            <p>Your will remains saved and accessible. No data has been lost — only this secondary member's
            participation has been removed.</p>`,
            "Manage My Will",
          ),
        }
      : {
          subject: `WillChain — A member has withdrawn from "${willName}"`,
          body: buildEmail(
            recipientName,
            `<p><strong>${name}</strong> has withdrawn their participation from
            the digital will <strong>"${willName}"</strong>.</p>
            <p>The will owner has been notified and may take steps to designate a replacement. The
            activation of the will may be temporarily delayed as a result.</p>
            <p>You can log in to your WillChain account to review the updated status of the will.</p>`,
            "View Will Status",
          ),
        };
  },

  [NotificationType.SECURITY_PERIOD_UPDATED]: ({
    willName,
    recipientName,
  }) => ({
    subject: `WillChain — Security period updated for "${willName}"`,
    body: buildEmail(
      recipientName,
      `<p>We are writing to inform you that the <strong>security period</strong> configuration for the
      digital will <strong>"${willName}"</strong> has been updated by its owner.</p>
      <p>The security period is a critical parameter that determines the time window during which a death
      declaration can be vetoed before the will execution process begins. Changes to this setting may
      affect the timeline of will execution.</p>
      <p>Please log in to your WillChain account to review the updated security period settings and
      ensure you are fully informed about the new configuration.</p>`,
      "Review Security Settings",
    ),
  }),

  [NotificationType.DEATH_DECLARED]: ({
    willName,
    recipientName,
    role,
    smName,
  }) => {
    const name = smName ?? "A secondary member";
    return role === NotificationRecipientRole.PM
      ? {
          subject: `⚠️ WillChain — URGENT: A death declaration was submitted for your will "${willName}"`,
          body: buildEmail(
            recipientName,
            `<p style="background-color:#3b1515;border-left:4px solid #ef4444;padding:16px 20px;border-radius:4px;color:#fca5a5;font-weight:600;">
              ⚠️ URGENT — Immediate action may be required.
            </p>
            <p><strong>${name}</strong> has submitted a <strong>death declaration</strong> against your digital will
            <strong>"${willName}"</strong> on WillChain. The security period is now active.</p>
            <p><strong>If you are still alive</strong>, you must log in to your WillChain account
            <strong>immediately</strong> and exercise your veto right before the security period expires.
            Failure to do so will result in the death declaration being confirmed, triggering the
            automatic execution of your will on the blockchain.</p>
            <p>Please treat this notification with the utmost urgency. If you did not expect this
            declaration and believe it was submitted in error or maliciously, do not delay in logging
            in to contest it.</p>`,
            "🚨 Exercise My Veto Right Now",
          ),
        }
      : {
          subject: `WillChain — Death declaration submitted for "${willName}"`,
          body: buildEmail(
            recipientName,
            `<p><strong>${name}</strong> has submitted a <strong>death declaration</strong> for the digital will
            <strong>"${willName}"</strong>, in which you are a designated participant.</p>
            <p>The security period has now begun. During this period, the primary member of the will has
            the opportunity to exercise their veto right if they believe the declaration is erroneous.</p>
            <p>If no veto is exercised before the security period expires, the death declaration will be
            confirmed and the will execution process will automatically commence on the blockchain. You
            will receive further notifications as the situation progresses.</p>
            <p>You can log in to your WillChain account to monitor the status of the security period
            in real time.</p>`,
            "Monitor Will Status",
          ),
        };
  },

  [NotificationType.DEATH_CONFIRMED]: ({
    willName,
    recipientName,
    role,
    smName,
  }) => {
    const name = smName ?? "A secondary member";
    return role === NotificationRecipientRole.PM
      ? {
          subject: `WillChain — Death declaration confirmed for will "${willName}"`,
          body: buildEmail(
            recipientName,
            `<p>We are writing to inform you that the death declaration submitted by <strong>${name}</strong>
            for your digital will <strong>"${willName}"</strong> has been <strong>officially confirmed</strong>.</p>
            <p>The security period has elapsed without a veto being exercised. As a result, the
            will execution process has been automatically initiated on the blockchain, in accordance
            with the terms you defined.</p>
            <p>All designated secondary members will be notified separately. The asset allocation
            process is now underway.</p>`,
            "View Will Execution Status",
          ),
        }
      : {
          subject: `WillChain — Will execution started for "${willName}"`,
          body: buildEmail(
            recipientName,
            `<p><strong>${name}</strong> has confirmed the death declaration for the digital will
            <strong>"${willName}"</strong>, which is now <strong>officially confirmed</strong>.</p>
            <p>The security period has elapsed and no veto was exercised. The will execution process
            has now been automatically initiated on the blockchain. Asset allocations will be processed
            in accordance with the terms defined by the will owner.</p>
            <p>Please log in to your WillChain account to monitor the execution status and review
            your designated asset allocation.</p>`,
            "View My Asset Allocation",
          ),
        };
  },

  [NotificationType.ASSETS_SWAPPED]: ({
    willName,
    recipientName,
    role,
    smName,
  }) => {
    const name = smName ?? "A secondary member";
    return role === NotificationRecipientRole.PM
      ? {
          subject: `WillChain — Asset swap executed in your will "${willName}"`,
          body: buildEmail(
            recipientName,
            `<p><strong>${name}</strong> has executed an <strong>asset swap</strong>
            within your digital will <strong>"${willName}"</strong>.</p>
            <p>The asset allocations defined in your will have been adjusted as part of this operation.
            The updated allocation is now recorded on the blockchain.</p>
            <p>Please log in to your WillChain account to review the new asset distribution and ensure
            it accurately reflects your intentions.</p>`,
            "Review Asset Allocation",
          ),
        }
      : {
          subject: `WillChain — Asset swap executed in "${willName}"`,
          body: buildEmail(
            recipientName,
            `<p><strong>${name}</strong> has executed an <strong>asset swap</strong>
            in the digital will <strong>"${willName}"</strong>, in which you are a designated participant.</p>
            <p>The asset allocations within the will have been updated accordingly. The new distribution
            is now recorded on the blockchain.</p>
            <p>You can log in to your WillChain account to review the updated allocation that pertains
            to your participation.</p>`,
            "View My Allocation",
          ),
        };
  },

  [NotificationType.VETO_EXERCISED]: ({ willName, recipientName }) => ({
    subject: `WillChain — Death declaration vetoed for will "${willName}"`,
    body: buildEmail(
      recipientName,
      `<p>We are writing to inform you that the primary member of the digital will
      <strong>"${willName}"</strong> has <strong>exercised their veto right</strong> and formally
      declined the death declaration that was submitted.</p>
      <p>As a result, the death declaration has been <strong style="color:#16a34a;">invalidated</strong>
      and the will remains fully active on the blockchain. No execution process has been initiated.</p>
      <p>You can log in to your WillChain account to consult the current status of the will and review
      any related activity.</p>`,
      "View Will Status",
    ),
  }),

  [NotificationType.EXECUTE_WILL]: ({ willName, recipientName }) => ({
    subject: `WillChain — Protection period ended for "${willName}" — Execution available`,
    body: buildEmail(
      recipientName,
      `<p>The <strong>protection period</strong> for the digital will
      <strong>"${willName}"</strong> has <strong>expired</strong>.</p>
      <p>The security waiting period has elapsed and no veto was exercised by the primary member.
      As a designated secondary member, you may now proceed with the <strong>execution of the will</strong>
      on the blockchain.</p>
      <p>Please log in to your WillChain account to initiate the execution process.</p>`,
      "Execute Will",
    ),
  }),
};

export function generateEmail(
  type: NotificationType,
  willName: string,
  recipientName: string,
  role: NotificationRecipientRole = NotificationRecipientRole.SM,
  smName?: string,
): EmailContent {
  return templates[type]({ willName, recipientName, role, smName });
}

/**
 * Generates a special invitation email for secondary members who do NOT yet
 * have a WillChain account. Directs them to /signup instead of /login.
 */
export function generateSignatureRequestInviteEmail(
  willName: string,
  recipientName: string,
): EmailContent {
  const subject = `WillChain — You have been named an executor in the will "${willName}"`;

  const body = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WillChain — You've been named an executor</title>
</head>
<body style="margin:0;padding:0;background-color:#0a192f;font-family:Inter,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a192f;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#172a45;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.4);border:1px solid #2d4a6f;">

          <!-- ── Header ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#0a192f 0%,#172a45 60%,#1e3a5f 100%);padding:40px 48px;text-align:center;border-bottom:1px solid #2d4a6f;">
              <p style="margin:0 0 6px;color:#9ca3af;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">Secure Digital Legacy</p>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:1px;">WillChain</h1>
              <div style="margin-top:16px;width:48px;height:3px;background-color:#22c55e;border-radius:2px;display:inline-block;"></div>
            </td>
          </tr>

          <!-- ── Announcement banner ── -->
          <tr>
            <td style="padding:0;">
              <div style="background-color:#1e3a5f;border-left:4px solid #22c55e;padding:20px 48px;text-align:center;">
                <p style="margin:0;color:#ffffff;font-size:16px;font-weight:700;letter-spacing:0.3px;">
                  🎉 You have been named an executor in a digital will
                </p>
              </div>
            </td>
          </tr>

          <!-- ── Greeting ── -->
          <tr>
            <td style="padding:40px 48px 0;">
              <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">Dear ${recipientName},</p>
            </td>
          </tr>

          <!-- ── Content ── -->
          <tr>
            <td style="padding:24px 48px 0;color:#d1d5db;font-size:15px;line-height:1.8;">
              <p style="margin:0 0 16px;">
                We are reaching out to inform you that you have been designated as a
                <strong style="color:#ffffff;">secondary member (executor)</strong> of the digital will
                <strong style="color:#ffffff;">"${willName}"</strong>, registered on the WillChain platform.
              </p>
              <p style="margin:0 0 16px;">
                WillChain is a secure, blockchain-based platform for managing digital legacies.
                As a designated executor, you play an important role in the execution of this
                will — and your formal participation must be validated before the will can
                become active.
              </p>

              <!-- ── What to do box ── -->
              <div style="background-color:#1e3a5f;border-radius:8px;padding:24px 28px;margin:24px 0;border:1px solid #2d4a6f;">
                <p style="margin:0 0 12px;color:#22c55e;font-size:15px;font-weight:700;">
                  📋 What you need to do
                </p>
                <ol style="margin:0;padding-left:20px;color:#d1d5db;line-height:2;">
                  <li>Create your free WillChain account using the button below.</li>
                  <li>Connect or import the blockchain wallet address that was designated for you.</li>
                  <li>Review the details of the will <strong style="color:#ffffff;">"${willName}"</strong>.</li>
                  <li>Formally validate your participation to confirm your role as an executor.</li>
                </ol>
              </div>

              <p style="margin:0 0 16px;">
                Your participation is required to activate the will. Until all designated
                executors have completed their validation, the will cannot become legally
                enforceable on the blockchain. We encourage you to complete this process at
                your earliest convenience.
              </p>
              <p style="margin:0;">
                If you are unfamiliar with WillChain, rest assured that creating an account is
                straightforward, free of charge, and fully secure. Your personal data is
                protected in accordance with our privacy policy.
              </p>
            </td>
          </tr>

          <!-- ── CTA Button ── -->
          <tr>
            <td style="padding:36px 48px;text-align:center;">
              <a href="${SIGNUP_URL}"
                 style="display:inline-block;background-color:#22c55e;color:#ffffff;text-decoration:none;padding:16px 44px;border-radius:8px;font-size:16px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(34,197,94,0.35);">
                Create My WillChain Account &rarr;
              </a>
              <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
                Already have an account?
                <a href="${LOGIN_URL}" style="color:#22c55e;">Sign in here</a><br /><br />
                Or copy this link into your browser:<br />
                <a href="${SIGNUP_URL}" style="color:#22c55e;word-break:break-all;">${SIGNUP_URL}</a>
              </p>
            </td>
          </tr>

          <!-- ── Divider ── -->
          <tr>
            <td style="padding:0 48px;">
              <div style="border-top:1px solid #2d4a6f;"></div>
            </td>
          </tr>

          <!-- ── FAQ Section ── -->
          <tr>
            <td style="padding:32px 48px 0;color:#d1d5db;font-size:14px;line-height:1.8;">
              <p style="margin:0 0 12px;color:#22c55e;font-size:15px;font-weight:700;">❓ Frequently asked questions</p>

              <p style="margin:0 0 4px;font-weight:600;color:#ffffff;">What is WillChain?</p>
              <p style="margin:0 0 16px;">
                WillChain is a blockchain-based platform that allows individuals to create, manage,
                and execute digital wills in a secure and transparent manner. All transactions and
                validations are recorded on the blockchain, ensuring immutability and trust.
              </p>

              <p style="margin:0 0 4px;font-weight:600;color:#ffffff;">Why do I need to create an account?</p>
              <p style="margin:0 0 16px;">
                Your WillChain account allows you to securely connect your blockchain wallet,
                review the details of your participation in the will, and formally validate your
                role as an executor. Without this validation, the will cannot be activated.
              </p>

              <p style="margin:0 0 4px;font-weight:600;color:#ffffff;">Is this email legitimate?</p>
              <p style="margin:0;">
                Yes. This notification was automatically generated by the WillChain platform on
                behalf of the will owner. If you believe you received this email in error or do
                not know the will owner, you may safely disregard this message.
              </p>
            </td>
          </tr>

          <!-- ── Closing ── -->
          <tr>
            <td style="padding:32px 48px 0;color:#d1d5db;font-size:15px;line-height:1.8;">
              <p style="margin:0;">
                If you have any questions or require assistance, our support team is available
                to help you at any stage of the account creation and validation process.
              </p>
              <p style="margin:20px 0 0;">
                Yours sincerely,<br />
                <strong style="color:#ffffff;">The WillChain Team</strong><br />
                <span style="color:#9ca3af;font-size:13px;">Secure Digital Legacy Management</span>
              </p>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="background-color:#0a192f;padding:28px 48px;margin-top:32px;border-top:1px solid #2d4a6f;">
              <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.7;text-align:center;">
                You are receiving this email because you have been designated as an executor
                in a digital will registered on the WillChain platform. If you believe this
                was sent to you in error, you may safely disregard it.<br /><br />
                &copy; ${CURRENT_YEAR} WillChain &mdash; All rights reserved.<br />
                WillChain is a secure blockchain-based platform for digital legacy management.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, body };
}
