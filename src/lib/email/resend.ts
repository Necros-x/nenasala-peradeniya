import "server-only";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export type SendEmailResult = {
  ok: boolean;
  skipped?: boolean;
  id?: string;
  error?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return { ok: false, skipped: true, error: "Resend is not configured." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo ?? process.env.RESEND_REPLY_TO ?? undefined,
      }),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({} as Record<string, unknown>));
    if (!response.ok) {
      const message = typeof payload?.message === "string" ? payload.message : `Resend returned ${response.status}.`;
      return { ok: false, error: message };
    }

    return { ok: true, id: typeof payload?.id === "string" ? payload.id : undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to send email." };
  }
}
