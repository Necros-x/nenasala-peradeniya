import "server-only";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function shell({
  preheader,
  eyebrow,
  title,
  content,
  actionLabel,
  actionUrl,
}: {
  preheader: string;
  eyebrow: string;
  title: string;
  content: string;
  actionLabel?: string;
  actionUrl?: string;
}) {
  const button = actionLabel && actionUrl
    ? `<p style="margin:28px 0 4px"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#ff6405;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:999px">${escapeHtml(actionLabel)}</a></p>`
    : "";

  return `<!doctype html>
<html><body style="margin:0;background:#f7f7f7;font-family:Inter,Arial,sans-serif;color:#283f4f">
<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f7f7;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e4e3df;border-radius:28px;overflow:hidden">
<tr><td style="padding:30px 34px 10px">
<div style="font-size:22px;font-weight:800;color:#ff6405">Nenasala Peradeniya</div>
<div style="margin-top:4px;font-size:12px;color:#8d9098">Learning Management System</div>
</td></tr>
<tr><td style="padding:24px 34px 34px">
<div style="font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#ff6405">${escapeHtml(eyebrow)}</div>
<h1 style="margin:10px 0 16px;font-size:28px;line-height:1.2;color:#283f4f">${escapeHtml(title)}</h1>
<div style="font-size:15px;line-height:1.7;color:#606470">${content}</div>
${button}
</td></tr>
<tr><td style="border-top:1px solid #e4e3df;padding:20px 34px;font-size:12px;line-height:1.6;color:#8d9098">This email was sent by Nenasala Peradeniya. Please do not share account-security links with anyone.</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export function notificationEmail({
  name,
  title,
  message,
  actionLabel = "Open in LMS",
  actionUrl,
}: {
  name: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
}) {
  const safeName = escapeHtml(firstName(name));
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");
  return {
    subject: title,
    text: `Hi ${firstName(name)},\n\n${message}${actionUrl ? `\n\n${actionUrl}` : ""}\n\nNenasala Peradeniya`,
    html: shell({
      preheader: message,
      eyebrow: "Learning update",
      title,
      content: `<p style="margin:0 0 14px">Hi ${safeName},</p><p style="margin:0">${safeMessage}</p>`,
      actionLabel,
      actionUrl,
    }),
  };
}

export function passwordResetEmail({ name, actionUrl }: { name: string; actionUrl: string }) {
  const displayName = firstName(name);
  return {
    subject: "Reset your Nenasala password",
    text: `Hi ${displayName},\n\nUse this link to reset your Nenasala password:\n${actionUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: shell({
      preheader: "Reset your Nenasala password",
      eyebrow: "Account security",
      title: "Reset your password",
      content: `<p style="margin:0 0 14px">Hi ${escapeHtml(displayName)},</p><p style="margin:0">We received a request to reset your Nenasala account password. Use the secure button below to choose a new password. If you did not request this, you can safely ignore this email.</p>`,
      actionLabel: "Reset password",
      actionUrl,
    }),
  };
}

export function purchaseReceiptEmail({
  name,
  reference,
  description,
  total,
  actionUrl,
}: {
  name: string;
  reference: string;
  description: string;
  total: string;
  actionUrl?: string;
}) {
  const displayName = firstName(name);
  const title = `Payment receipt ${reference}`;
  return {
    subject: title,
    text: `Hi ${displayName},\n\nPayment received for ${description}.\nTotal: ${total}\nReference: ${reference}`,
    html: shell({
      preheader: title,
      eyebrow: "Payment receipt",
      title: "Payment received",
      content: `<p style="margin:0 0 14px">Hi ${escapeHtml(displayName)},</p><p style="margin:0 0 10px">We received your payment for ${escapeHtml(description)}.</p><p style="margin:0"><strong>Total:</strong> ${escapeHtml(total)}<br /><strong>Reference:</strong> ${escapeHtml(reference)}</p>`,
      actionLabel: actionUrl ? "View account" : undefined,
      actionUrl,
    }),
  };
}
