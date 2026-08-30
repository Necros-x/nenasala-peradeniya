import "server-only";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || "there";
}

function shell({
  eyebrow,
  title,
  content,
}: {
  eyebrow: string;
  title: string;
  content: string;
}) {
  return `<!doctype html>
<html><body style="margin:0;background:#f7f7f7;font-family:Inter,Arial,sans-serif;color:#283f4f">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f7f7;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e4e3df;border-radius:28px;overflow:hidden">
<tr><td style="padding:30px 34px 10px">
<div style="font-size:22px;font-weight:800;color:#ff6405">Nenasala Peradeniya</div>
<div style="margin-top:4px;font-size:12px;color:#8d9098">Contact & Support</div>
</td></tr>
<tr><td style="padding:24px 34px 34px">
<div style="font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#ff6405">${escapeHtml(eyebrow)}</div>
<h1 style="margin:10px 0 16px;font-size:28px;line-height:1.2;color:#283f4f">${escapeHtml(title)}</h1>
<div style="font-size:15px;line-height:1.7;color:#606470">${content}</div>
</td></tr>
<tr><td style="border-top:1px solid #e4e3df;padding:20px 34px;font-size:12px;line-height:1.6;color:#8d9098">Nenasala Peradeniya · Learning Management System</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export function contactAcknowledgementEmail({
  name,
  subject,
  institutionName,
}: {
  name: string;
  subject: string;
  institutionName: string;
}) {
  const displayName = firstName(name);
  return {
    subject: `We received your message — ${subject}`,
    text: `Hi ${displayName},\n\nWe received your message about "${subject}". Our team will review it and reply to this email address.\n\n${institutionName}`,
    html: shell({
      eyebrow: "Message received",
      title: "Thanks for contacting us",
      content: `<p style="margin:0 0 14px">Hi ${escapeHtml(displayName)},</p><p style="margin:0">We received your message about <strong>${escapeHtml(subject)}</strong>. Our team will review it and reply to this email address.</p><p style="margin:18px 0 0">${escapeHtml(institutionName)}</p>`,
    }),
  };
}

export function contactInternalNotificationEmail({
  name,
  email,
  category,
  subject,
  message,
}: {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
}) {
  return {
    subject: `New website inquiry — ${subject}`,
    text: `New website inquiry\n\nFrom: ${name} <${email}>\nCategory: ${category}\nSubject: ${subject}\n\n${message}`,
    html: shell({
      eyebrow: "New website inquiry",
      title: subject,
      content: `<p style="margin:0 0 12px"><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;<br /><strong>Category:</strong> ${escapeHtml(category)}</p><div style="margin-top:18px;padding:16px;border-radius:14px;background:#f7f7f7;white-space:pre-wrap">${escapeHtml(message)}</div>`,
    }),
  };
}

export function contactReplyEmail({
  name,
  subject,
  message,
  institutionName,
}: {
  name: string;
  subject: string;
  message: string;
  institutionName: string;
}) {
  const displayName = firstName(name);
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");
  return {
    subject: `Re: ${subject}`,
    text: `Hi ${displayName},\n\n${message}\n\n${institutionName}`,
    html: shell({
      eyebrow: "Support reply",
      title: `Re: ${subject}`,
      content: `<p style="margin:0 0 14px">Hi ${escapeHtml(displayName)},</p><p style="margin:0">${safeMessage}</p><p style="margin:18px 0 0">${escapeHtml(institutionName)}</p>`,
    }),
  };
}
