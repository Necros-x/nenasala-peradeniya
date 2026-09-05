"use client";

import { useMemo, useState, useTransition } from "react";
import { Mail, Pencil, Plus, ShieldCheck, Trash2, UserCog, UsersRound, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  deleteInternalUserAction,
  inviteInternalUserAction,
  updateInternalUserAction,
} from "@/lib/actions/admin/internal-users";
import type { InternalUserRecord } from "@/lib/services/internal-users";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const input =
  "mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary outline-none focus:ring-1 focus:ring-brand-primary";

function roleLabel(role: InternalUserRecord["role"]) {
  if (role === "super_admin") return "Super Admin";
  if (role === "admin") return "Admin";
  return "Staff";
}

export default function InternalUsersManager({
  users,
  accessKey,
  canManage,
  currentUserId,
}: {
  users: InternalUserRecord[];
  accessKey: string;
  canManage: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<InternalUserRecord | null>(null);
  const [deleting, setDeleting] = useState<InternalUserRecord | null>(null);

  const counts = useMemo(
    () => ({
      total: users.length,
      superAdmins: users.filter((user) => user.role === "super_admin").length,
      admins: users.filter((user) => user.role === "admin").length,
      staff: users.filter((user) => user.role === "staff").length,
    }),
    [users],
  );

  function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("accessKey", accessKey);

    startTransition(async () => {
      const result = await inviteInternalUserAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to invite internal user.");
        return;
      }
      toast.success(`Invitation sent to ${result.email}.`);
      form.reset();
      router.refresh();
    });
  }

  function update(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;

    const formData = new FormData(event.currentTarget);
    formData.set("accessKey", accessKey);
    formData.set("user_id", editing.id);

    startTransition(async () => {
      const result = await updateInternalUserAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to update internal user.");
        return;
      }
      toast.success("Internal account updated.");
      setEditing(null);
      router.refresh();
    });
  }

  function remove() {
    if (!deleting) return;
    const formData = new FormData();
    formData.set("accessKey", accessKey);
    formData.set("user_id", deleting.id);

    startTransition(async () => {
      const result = await deleteInternalUserAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Unable to delete internal account.");
        return;
      }
      toast.success("Internal account deleted.");
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-primary">People</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">Internal Accounts</h1>
        <p className="mt-1 text-text-secondary">
          Super Admins can create and manage Staff, Admin and Super Admin identities. Your own privileged role is protected server-side.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Internal accounts", counts.total],
          ["Super Admin", counts.superAdmins],
          ["Admin", counts.admins],
          ["Staff", counts.staff],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-[var(--radius-lg)] border border-border bg-surface p-1">
            <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-4">
              <p className="text-2xl font-bold text-text-primary">{value}</p>
              <p className="mt-1 text-sm text-text-secondary">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {canManage ? (
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
          <form onSubmit={invite} className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-brand-primary" />
              <h2 className="text-lg font-bold text-text-primary">Invite internal account</h2>
            </div>
            <p className="mt-1 text-xs text-text-muted">Resend is required. The new user receives a branded secure setup link.</p>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label>
                <span className="text-sm font-semibold text-text-primary">Full name</span>
                <input name="full_name" required className={input} />
              </label>
              <label>
                <span className="text-sm font-semibold text-text-primary">Email</span>
                <input name="email" type="email" required className={input} />
              </label>
              <label>
                <span className="text-sm font-semibold text-text-primary">Phone</span>
                <input name="phone" className={input} />
              </label>
              <label>
                <span className="text-sm font-semibold text-text-primary">Role</span>
                <select name="role" defaultValue="staff" className={input}>
                  <option value="staff">Staff — Communications</option>
                  <option value="admin">Admin — Administration + LMS + Analytics</option>
                  <option value="super_admin">Super Admin — Full privileged access</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-bold text-[var(--color-static-white)] hover:bg-brand-primary-hover disabled:opacity-50"
            >
              <Mail className="h-4 w-4" />
              {pending ? "Sending..." : "Send invitation"}
            </button>
          </form>
        </section>
      ) : (
        <div className="rounded-[var(--radius-md)] border border-border bg-surface p-1">
          <div className="rounded-[calc(var(--radius-md)-4px)] bg-surface-muted px-4 py-3 text-sm text-text-secondary">
            Account management is read-only for Admin users. Super Admin approval is required to create, edit or delete internal accounts.
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-sm">
        <div className="rounded-[calc(var(--radius-lg)-4px)] bg-surface-muted">
          {users.length === 0 ? (
            <div className="p-10 text-center">
              <UsersRound className="mx-auto h-8 w-8 text-text-muted" />
              <p className="mt-3 font-semibold text-text-primary">No internal accounts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-background text-[11px] uppercase tracking-wide text-text-muted">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const protectedUser = user.role === "super_admin";
                    const currentUser = user.id === currentUserId;
                    return (
                      <tr key={user.id} className="border-b border-border/70 last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-text-primary">{user.full_name}</p>
                          <p className="mt-0.5 text-xs text-text-muted">{user.email ?? "No email"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-xs font-bold text-brand-primary">
                            {protectedUser ? <ShieldCheck className="h-3.5 w-3.5" /> : <UserCog className="h-3.5 w-3.5" />}
                            {roleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                            user.status === "active"
                              ? "bg-[var(--status-success-soft)] text-success"
                              : user.status === "suspended"
                                ? "bg-[var(--status-error-soft)] text-danger"
                                : "bg-background text-text-secondary"
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{user.phone ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              disabled={!canManage || currentUser || pending}
                              onClick={() => setEditing(user)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-bold text-text-primary hover:bg-background disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              type="button"
                              disabled={!canManage || currentUser || pending}
                              onClick={() => setDeleting(user)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-danger/30 px-3 py-2 text-xs font-bold text-danger hover:bg-[var(--status-error-soft)] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {editing && (
        <div
          className="fixed inset-0 z-[150] grid place-items-center bg-[var(--color-static-black)]/50 p-4 backdrop-blur-[2px]"
          onMouseDown={() => !pending && setEditing(null)}
        >
          <div
            className="w-full max-w-xl rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <form onSubmit={update} className="rounded-[calc(var(--radius-lg)-4px)] bg-background p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-primary">Internal account</p>
                  <h2 className="mt-1 text-xl font-bold text-text-primary">Edit {editing.full_name}</h2>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setEditing(null)}
                  className="grid h-9 w-9 place-items-center rounded-md text-text-muted hover:bg-surface-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="text-sm font-semibold text-text-primary">Full name</span>
                  <input name="full_name" required defaultValue={editing.full_name} className={input} />
                </label>
                <label>
                  <span className="text-sm font-semibold text-text-primary">Email</span>
                  <input name="email" type="email" required defaultValue={editing.email ?? ""} className={input} />
                </label>
                <label>
                  <span className="text-sm font-semibold text-text-primary">Phone</span>
                  <input name="phone" defaultValue={editing.phone ?? ""} className={input} />
                </label>
                <label>
                  <span className="text-sm font-semibold text-text-primary">Role</span>
                  <select name="role" defaultValue={editing.role} className={input}>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </label>
                <label className="md:col-span-2">
                  <span className="text-sm font-semibold text-text-primary">Account status</span>
                  <select name="status" defaultValue={editing.status} className={input}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(null)} className="rounded-md border border-border px-4 py-2.5 text-sm font-bold text-text-primary hover:bg-surface-muted">
                  Cancel
                </button>
                <button disabled={pending} type="submit" className="rounded-md bg-brand-primary px-4 py-2.5 text-sm font-bold text-[var(--color-static-white)] disabled:opacity-50">
                  {pending ? "Saving..." : "Save account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete internal account?"
        description={
          deleting ? (
            <>
              <span className="font-semibold text-text-primary">{deleting.full_name}</span> will immediately lose access and their authentication account will be deleted.
            </>
          ) : null
        }
        destructive
        pending={pending}
        confirmLabel="Delete account"
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      />
    </div>
  );
}
