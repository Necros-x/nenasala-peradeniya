"use client";

import { useMemo, useState, useTransition } from "react";
import { Mail, MessageSquare, Send, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  replyContactMessageAction,
  saveContactMessageAction,
} from "@/lib/actions/admin/contact-messages";
import type {
  ContactMessageRecord,
  ContactMessageStatus,
} from "@/lib/services/contact-messages";

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

function statusClass(status: ContactMessageStatus) {
  if (status === "new") return "bg-[var(--color-primary-soft)] text-brand-primary";
  if (status === "replied") return "bg-[var(--status-success-soft)] text-success";
  if (status === "closed") return "bg-background text-text-muted";
  return "bg-[var(--color-info-soft)] text-info";
}

export default function MessagesManager({
  messages,
  accessKey,
}: {
  messages: ContactMessageRecord[];
  accessKey: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ContactMessageStatus>("all");
  const [selectedId, setSelectedId] = useState(messages[0]?.id ?? null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return messages.filter((message) => {
      if (status !== "all" && message.status !== status) return false;
      if (!needle) return true;
      return [
        message.name,
        message.email,
        message.subject,
        message.category,
        message.message,
      ].some((value) => value.toLowerCase().includes(needle));
    });
  }, [messages, query, status]);

  const selected =
    messages.find((message) => message.id === selectedId) ??
    filtered[0] ??
    null;

  const counts = {
    total: messages.length,
    new: messages.filter((message) => message.status === "new").length,
    replied: messages.filter((message) => message.status === "replied").length,
    closed: messages.filter((message) => message.status === "closed").length,
  };

  function saveMeta(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;

    const formData = new FormData(event.currentTarget);
    formData.set("accessKey", accessKey);
    formData.set("message_id", selected.id);

    startTransition(async () => {
      const result = await saveContactMessageAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to update inquiry.");
        return;
      }
      toast.success("Inquiry updated.");
      router.refresh();
    });
  }

  function reply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("accessKey", accessKey);
    formData.set("message_id", selected.id);

    startTransition(async () => {
      const result = await replyContactMessageAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to send reply.");
        return;
      }
      toast.success("Reply sent through Resend.");
      form.reset();
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-primary">Communications</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">Messages</h1>
        <p className="mt-1 text-text-secondary">
          Website inquiries, internal notes and replies sent through Resend.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["All inquiries", counts.total],
          ["New", counts.new],
          ["Replied", counts.replied],
          ["Closed", counts.closed],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-[var(--radius-lg)] border border-border bg-surface p-1">
            <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-4">
              <p className="text-2xl font-bold text-text-primary">{value}</p>
              <p className="mt-1 text-sm text-text-secondary">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid min-h-[650px] gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
          <div className="flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted">
            <div className="border-b border-border p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search inquiries..."
                  className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(["all", "new", "read", "replied", "closed"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatus(value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                      status === value
                        ? "bg-brand-primary text-[var(--color-static-white)]"
                        : "border border-border bg-background text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {titleCase(value)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-sm text-text-muted">No inquiries match this filter.</div>
              ) : (
                filtered.map((message) => (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => setSelectedId(message.id)}
                    className={`block w-full border-b border-border px-4 py-4 text-left transition-colors last:border-0 ${
                      selected?.id === message.id ? "bg-background" : "hover:bg-background/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-text-primary">{message.name}</p>
                        <p className="mt-0.5 truncate text-xs text-text-muted">{message.email}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${statusClass(message.status)}`}>
                        {titleCase(message.status)}
                      </span>
                    </div>
                    <p className="mt-3 truncate text-sm font-semibold text-text-secondary">{message.subject}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-muted">{message.message}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-wide text-text-muted">{dateTime(message.created_at)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
          <div className="h-full rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5 sm:p-6">
            {!selected ? (
              <div className="grid h-full min-h-[450px] place-items-center text-center">
                <div>
                  <MessageSquare className="mx-auto h-9 w-9 text-text-muted" />
                  <p className="mt-3 font-semibold text-text-primary">Select an inquiry</p>
                  <p className="mt-1 text-sm text-text-secondary">Choose a message from the inbox to review it.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(selected.status)}`}>
                        {titleCase(selected.status)}
                      </span>
                      <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-bold text-text-secondary">
                        {titleCase(selected.category)}
                      </span>
                    </div>
                    <h2 className="mt-3 text-2xl font-bold text-text-primary">{selected.subject}</h2>
                    <p className="mt-2 text-sm text-text-secondary">
                      <span className="font-semibold text-text-primary">{selected.name}</span> · {selected.email}
                      {selected.phone ? ` · ${selected.phone}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">Received {dateTime(selected.created_at)}</p>
                  </div>

                  <a
                    href={`mailto:${selected.email}`}
                    className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-bold text-text-primary hover:bg-surface"
                  >
                    <Mail className="h-4 w-4" /> Open email
                  </a>
                </div>

                <div className="rounded-md border border-border bg-background p-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-text-primary">{selected.message}</p>
                </div>

                {selected.replies.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Reply history</h3>
                    <div className="mt-3 space-y-3">
                      {selected.replies.map((reply) => (
                        <div key={reply.id} className="rounded-md border border-border bg-background p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-bold text-text-primary">{reply.sender_name}</p>
                            <span className={`text-[10px] font-bold uppercase ${
                              reply.delivery_status === "sent" ? "text-success" : "text-danger"
                            }`}>
                              {reply.delivery_status}
                            </span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{reply.body}</p>
                          <p className="mt-2 text-[10px] text-text-muted">{dateTime(reply.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-5 lg:grid-cols-2">
                  <form onSubmit={saveMeta} className="rounded-md border border-border bg-background p-4">
                    <h3 className="text-sm font-bold text-text-primary">Internal handling</h3>

                    <label className="mt-4 block">
                      <span className="text-xs font-semibold text-text-secondary">Status</span>
                      <select
                        name="status"
                        defaultValue={selected.status}
                        key={`${selected.id}-${selected.status}`}
                        className="mt-2 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary"
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="replied">Replied</option>
                        <option value="closed">Closed</option>
                      </select>
                    </label>

                    <label className="mt-4 block">
                      <span className="text-xs font-semibold text-text-secondary">Internal notes</span>
                      <textarea
                        name="admin_notes"
                        rows={5}
                        maxLength={5000}
                        defaultValue={selected.admin_notes ?? ""}
                        key={`${selected.id}-notes`}
                        className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                    </label>

                    <button
                      disabled={pending}
                      type="submit"
                      className="mt-4 rounded-md border border-border px-4 py-2.5 text-sm font-bold text-text-primary hover:bg-surface-muted disabled:opacity-50"
                    >
                      Save handling
                    </button>
                  </form>

                  <form onSubmit={reply} className="rounded-md border border-border bg-background p-4">
                    <h3 className="text-sm font-bold text-text-primary">Reply through Resend</h3>
                    <p className="mt-1 text-xs text-text-muted">Sent to {selected.email} and stored in this inquiry history.</p>

                    <textarea
                      name="body"
                      rows={8}
                      required
                      maxLength={10000}
                      placeholder="Write your reply..."
                      className="mt-4 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary"
                    />

                    <button
                      disabled={pending}
                      type="submit"
                      className="mt-4 inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-bold text-[var(--color-static-white)] hover:bg-brand-primary-hover disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      {pending ? "Sending..." : "Send reply"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
