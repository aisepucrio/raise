import { cn } from "@/lib/utils";

// Actions that the row UI can enable based on current status.
export type FormatStatusItemActions = {
  stopActionActive: boolean;
  restartActionActive: boolean;
};

// Single structure returned for visual usage + rules without duplicated switch/ifs.
export type FormatStatusItemInfo = {
  rawStatus: string;
  label: string;
  colorVariableName: string;
  actions: FormatStatusItemActions;
};

export type FormatStatusItemProps = {
  status?: string | null;
  className?: string;
};

// Normalizes API status for comparison without case/spacing dependence.
function normalizeStatus(status?: string | null) {
  if (typeof status !== "string") return "";
  return status.trim().toUpperCase();
}

// Simple helper to keep return values standardized and status blocks readable.
function buildStatusInfo(
  rawStatus: string,
  label: string,
  colorVariableName: string,
  actions: FormatStatusItemActions,
): FormatStatusItemInfo {
  return {
    rawStatus,
    label,
    colorVariableName,
    actions,
  };
}

// Single source of truth for status label, color, and enabled actions.
// JobsPage sends only the status string; this component resolves the rest.
// Button enabled/disabled states are mapped 1-to-1 to cover possible future cases.
export function getFormatStatusItemInfo(
  status?: string | null,
): FormatStatusItemInfo {
  const normalizedStatus = normalizeStatus(status);
  const rawStatus = typeof status === "string" ? status : "";

  if (normalizedStatus === "STARTED") {
    return buildStatusInfo(
      rawStatus,
      "In Progress",
      "--color-indigo",
      {
        stopActionActive: true,
        restartActionActive: false,
      },
    );
  }

  if (normalizedStatus === "PENDING") {
    return buildStatusInfo(
      rawStatus,
      "In Queue",
      "--color-amber",
      {
        stopActionActive: false,
        restartActionActive: false,
      },
    );
  }

  if (normalizedStatus === "SUCCESS" || normalizedStatus === "COMPLETED") {
    return buildStatusInfo(
      rawStatus,
      "Finished",
      "--color-teal",
      {
        stopActionActive: false,
        restartActionActive: false,
      },
    );
  }

  if (normalizedStatus === "FAILURE") {
    return buildStatusInfo(
      rawStatus,
      "Failure",
      "--color-rose",
      {
        stopActionActive: false,
        restartActionActive: true,
      },
    );
  }

  if (normalizedStatus === "REVOKED") {
    return buildStatusInfo(
      rawStatus,
      "Cancelled",
      "--color-slate",
      {
        stopActionActive: false,
        restartActionActive: true,
      },
    );
  }

  if (normalizedStatus === "PROGRESS") {
    return buildStatusInfo(
      rawStatus,
      "In Progress",
      "--color-indigo",
      {
        stopActionActive: false,
        restartActionActive: false,
      },
    );
  }

  // Fallback for unmapped status: short and predictable label.
  // Raw value remains available in the element title for inspection.
  return buildStatusInfo(rawStatus, "Unknown", "--color-steel", {
    stopActionActive: false,
    restartActionActive: false,
  });
}

export function FormatStatusItem({ status, className }: FormatStatusItemProps) {
  // Visual component uses the exact same rules the page uses for actions.
  const info = getFormatStatusItemInfo(status);
  const colorValue = `var(${info.colorVariableName})`;

  return (
    <span
      data-slot="format-status-item"
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap",
        className,
      )}
      title={info.rawStatus || undefined}
    >
      {/* Quick visual indicator (dot) for table scanning. */}
      <span
        aria-hidden="true"
        className="size-2 rounded-full"
        style={{ backgroundColor: colorValue }}
      />
      {/* Text already translated/normalized for UI display. */}
      <span className="font-semibold" style={{ color: colorValue }}>
        {info.label}
      </span>
    </span>
  );
}
