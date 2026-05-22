"use client";

import type { ReactNode } from "react";

type HeaderIconLabelProps = {
  label: string;
  children: ReactNode;
  badge?: ReactNode;
  /** Tighter label for the side cart tab */
  compact?: boolean;
};

/** Icon + text label stack for header actions (keeps badges on the icon). */
export function HeaderIconLabel({
  label,
  children,
  badge,
  compact = false,
}: HeaderIconLabelProps) {
  return (
    <>
      <span className="site-header-action__icon" aria-hidden>
        {children}
        {badge}
      </span>
      <span
        className={
          compact
            ? "site-header-action__label site-header-action__label--compact"
            : "site-header-action__label"
        }
      >
        {label}
      </span>
    </>
  );
}
