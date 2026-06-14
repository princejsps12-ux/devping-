import { Resend } from 'resend';
import { env } from '../config/env';
import { formatDuration } from '../utils/time';

// Only construct a client when a key is configured; otherwise alerts are
// skipped gracefully (logged) so local/dev runs work without Resend.
const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

const ACCENT = '#00DC82';
const DOWN = '#FF4D4D';

interface RenderedEmail {
  subject: string;
  html: string;
}

function formatTimestamp(date: Date): string {
  return date.toUTCString();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface LayoutArgs {
  accent: string;
  emoji: string;
  heading: string;
  intro: string;
  rows: Array<{ label: string; value: string; mono?: boolean }>;
  ctaUrl: string;
}

/**
 * Professional, email-client-safe HTML (inline styles, table layout, light
 * card with a colored status bar).
 */
function layout({ accent, emoji, heading, intro, rows, ctaUrl }: LayoutArgs): string {
  const rowsHtml = rows
    .map(
      ({ label, value, mono }) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #ededed;color:#6b6b6b;font-size:13px;">${escapeHtml(label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #ededed;color:#171717;font-size:13px;text-align:right;${
          mono ? "font-family:'SFMono-Regular',Consolas,monospace;" : ''
        }">${escapeHtml(value)}</td>
      </tr>`
    )
    .join('');

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #ededed;">
            <!-- Status bar -->
            <tr>
              <td style="height:4px;background-color:${accent};font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <!-- Brand -->
            <tr>
              <td style="padding:24px 28px 0 28px;">
                <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background-color:${ACCENT};vertical-align:middle;"></span>
                <span style="font-size:15px;font-weight:600;color:#171717;vertical-align:middle;margin-left:7px;">DevPing</span>
              </td>
            </tr>
            <!-- Heading -->
            <tr>
              <td style="padding:18px 28px 0 28px;">
                <h1 style="margin:0;font-size:21px;line-height:1.3;color:#171717;font-weight:600;">${emoji} ${escapeHtml(heading)}</h1>
                <p style="margin:8px 0 0 0;font-size:14px;line-height:1.6;color:#525252;">${escapeHtml(intro)}</p>
              </td>
            </tr>
            <!-- Details -->
            <tr>
              <td style="padding:20px 28px 0 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
              </td>
            </tr>
            <!-- CTA -->
            <tr>
              <td style="padding:24px 28px 28px 28px;">
                <a href="${ctaUrl}" style="display:inline-block;background-color:${ACCENT};color:#08130d;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:8px;">View monitor →</a>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:18px 28px;border-top:1px solid #ededed;">
                <p style="margin:0;font-size:12px;color:#8f8f8f;line-height:1.5;">You're receiving this because you have a monitor set up on DevPing.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderDownAlert(monitorName: string, monitorUrl: string, detectedAt: Date): RenderedEmail {
  return {
    subject: `🔴 ${monitorName} is DOWN`,
    html: layout({
      accent: DOWN,
      emoji: '🔴',
      heading: `${monitorName} is down`,
      intro: `We couldn't reach ${monitorName}. We'll let you know as soon as it recovers.`,
      rows: [
        { label: 'Status', value: 'Down' },
        { label: 'URL', value: monitorUrl, mono: true },
        { label: 'Detected at', value: formatTimestamp(detectedAt), mono: true },
      ],
      ctaUrl: `${env.appUrl}/dashboard`,
    }),
  };
}

export function renderRecoveryAlert(
  monitorName: string,
  monitorUrl: string,
  downtimeMs: number,
  recoveredAt: Date
): RenderedEmail {
  return {
    subject: `✅ ${monitorName} is back UP`,
    html: layout({
      accent: ACCENT,
      emoji: '✅',
      heading: `${monitorName} recovered`,
      intro: `Good news — ${monitorName} is responding again.`,
      rows: [
        { label: 'Status', value: 'Up' },
        { label: 'URL', value: monitorUrl, mono: true },
        { label: 'Was down for', value: formatDuration(downtimeMs), mono: true },
        { label: 'Recovered at', value: formatTimestamp(recoveredAt), mono: true },
      ],
      ctaUrl: `${env.appUrl}/dashboard`,
    }),
  };
}

async function send(to: string, { subject, html }: RenderedEmail): Promise<void> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping "${subject}" to ${to}`);
    return;
  }
  const { data, error } = await resend.emails.send({ from: env.emailFrom, to, subject, html });
  if (error) {
    throw new Error(`Resend failed: ${JSON.stringify(error)}`);
  }
  console.log(`[email] sent "${subject}" to ${to} (id: ${data?.id})`);
}

/** "🔴 [name] is DOWN" alert to the monitor's owner. */
export async function sendDownAlert(
  userEmail: string,
  monitorName: string,
  monitorUrl: string
): Promise<void> {
  await send(userEmail, renderDownAlert(monitorName, monitorUrl, new Date()));
}

/** "✅ [name] is back UP" alert, including how long it was down. */
export async function sendRecoveryAlert(
  userEmail: string,
  monitorName: string,
  monitorUrl: string,
  downtimeMs: number
): Promise<void> {
  await send(userEmail, renderRecoveryAlert(monitorName, monitorUrl, downtimeMs, new Date()));
}
