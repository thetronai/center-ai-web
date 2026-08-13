import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

const ICON_TONES = {
  grey: "bg-grey-100 text-grey-500",
  red: "bg-red-50 text-red-500",
  amber: "bg-amber-50 text-amber-500",
} as const;

interface Action {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface StateScreenProps {
  icon: ComponentType<{ className?: string }>;
  tone: keyof typeof ICON_TONES;
  heading: string;
  body: string;
  infoBox?: ReactNode;
  primaryAction: Action;
  secondaryAction?: Action;
}

/**
 * Shared full-bleed template matching the confirmed "Global States" frames
 * (You're offline / Something went wrong): icon in a soft circle, bold
 * centered heading, grey body copy, optional bordered info box, then a
 * stacked primary (filled) + secondary (outline) button.
 */
export function StateScreen({
  icon: Icon,
  tone,
  heading,
  body,
  infoBox,
  primaryAction,
  secondaryAction,
}: StateScreenProps) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-full ${ICON_TONES[tone]}`}>
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="font-display text-lg font-bold text-grey-900">{heading}</h2>
      <p className="mt-2 max-w-sm text-sm text-grey-600">{body}</p>

      {infoBox && (
        <div className="mt-4 w-full max-w-sm rounded-xl border border-grey-200 bg-white px-4 py-3 text-sm text-grey-600">
          {infoBox}
        </div>
      )}

      <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
        <ActionButton action={primaryAction} variant="primary" />
        {secondaryAction && <ActionButton action={secondaryAction} variant="secondary" />}
      </div>
    </div>
  );
}

function ActionButton({ action, variant }: { action: Action; variant: "primary" | "secondary" }) {
  const className =
    variant === "primary"
      ? "w-full rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
      : "w-full rounded-full border border-grey-200 bg-white px-5 py-3 text-sm font-semibold text-grey-800 transition-colors hover:bg-grey-50";

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  );
}
