export function accountInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NU";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AccountAvatar({
  name,
  avatarUrl,
  className = "h-8 w-8",
  textClassName = "text-xs",
}: {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  textClassName?: string;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${className} shrink-0 rounded-full border border-[var(--color-border)] object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${className} ${textClassName} grid shrink-0 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-primary-soft)] font-bold text-[var(--color-primary)]`}
    >
      {accountInitials(name)}
    </span>
  );
}
