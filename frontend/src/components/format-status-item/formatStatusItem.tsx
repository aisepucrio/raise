import { cn } from "@/lib/utils";

// Ações que a UI da linha pode habilitar com base no status atual.
export type FormatStatusItemActions = {
  stopActionActive: boolean;
  restartActionActive: boolean;
};

// Estrutura única retornada para a tela usar visual + regra sem duplicar switch/ifs.
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

// Normaliza o status da API para comparar sem depender de caixa/espaços.
function normalizeStatus(status?: string | null) {
  if (typeof status !== "string") return "";
  return status.trim().toUpperCase();
}

// Helper simples para manter o retorno padronizado e deixar os blocos de status legíveis.
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

// Fonte única da verdade para label, cor e ações habilitadas por status.
// A JobsPage só envia a string; daqui para baixo o componente decide o resto.
// Para retornar o status dos botões (ativo/inativo), há um mapeamento 1-a-1 para cobrir possíveis futuros casos
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

  // Fallback para status não mapeado: label curta e previsível.
  // O valor bruto ainda fica disponível no title do elemento para inspeção.
  return buildStatusInfo(rawStatus, "Unknown", "--color-steel", {
    stopActionActive: false,
    restartActionActive: false,
  });
}

export function FormatStatusItem({ status, className }: FormatStatusItemProps) {
  // O componente visual usa exatamente a mesma regra que a página usa para ações.
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
      {/* Indicador visual rápido (bolinha) para leitura da tabela. */}
      <span
        aria-hidden="true"
        className="size-2 rounded-full"
        style={{ backgroundColor: colorValue }}
      />
      {/* Texto já traduzido/normalizado para exibição na UI. */}
      <span className="font-semibold" style={{ color: colorValue }}>
        {info.label}
      </span>
    </span>
  );
}
