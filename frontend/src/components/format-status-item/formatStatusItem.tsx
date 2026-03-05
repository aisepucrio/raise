import { cn } from "@/lib/utils";

// actions that the UI of the row pode habilitar with base in the status atual.
export type FormatStatusItemActions = {
  stopActionActive: boolean;
  restartActionActive: boolean;
};

// Estrutura single retornada for the screen use visual + rule without duplicar switch/ifs.
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

// normalizes the status of the API for compare without depender of caixa/spaces.
function normalizeStatus(status?: string | null) {
  if (typeof status !== "string") return "";
  return status.trim().toUpperCase();
}

// Helper simple for keep the retorno standardized and deixar the blocos of status readable.
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

// source single of the verdade for label, color and actions habilitadas for status.
// the JobsPage only envia the string; dhere for baixo the component decide the resto.
// for retornar the status of the buttons (ativo/inativo), there is the mapeamento 1-the-1 for cobrir possible futuros cases
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

  // Fallback for status not mapeado: label curta and predictable.
  // the value bruto ainda fica available in the title of the element for inspection.
  return buildStatusInfo(rawStatus, "Unknown", "--color-steel", {
    stopActionActive: false,
    restartActionActive: false,
  });
}

export function FormatStatusItem({ status, className }: FormatStatusItemProps) {
  // the component visual usa exatamente the same rule that the page usa for actions.
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
      {/* indicator visual quick (dot) for reading of the table. */}
      <span
        aria-hidden="true"
        className="size-2 rounded-full"
        style={{ backgroundColor: colorValue }}
      />
      {/* text already traduzido/normalizado for display in the UI. */}
      <span className="font-semibold" style={{ color: colorValue }}>
        {info.label}
      </span>
    </span>
  );
}
