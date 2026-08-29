"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { ThemePreference } from "@/lib/services/preferences";

const options: Array<{ value: ThemePreference; label: string; icon: typeof Monitor }> = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export function ThemeMenu({ className = "", showLabel = false }: { className?: string; showLabel?: boolean }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const CurrentIcon = theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change appearance"
        className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text-secondary)] shadow-sm transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] ${showLabel ? "min-w-[112px]" : "w-10 px-0"}`}
      >
        <CurrentIcon className="h-4 w-4" />
        {showLabel && <span className="text-sm font-semibold">{options.find((item) => item.value === theme)?.label}</span>}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-[120] mt-2 w-44 overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-floating)]">
          {options.map((option) => {
            const Icon = option.icon;
            const selected = option.value === theme;
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setTheme(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm font-medium transition-colors ${selected ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"}`}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{option.label}</span>
                {selected && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
