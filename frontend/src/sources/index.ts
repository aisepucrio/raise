// Ids dos sources disponíveis na aplicação.
export const sourceIds = ["github", "jira", "stackoverflow"] as const;

// Tipo que representa os ids dos sources disponíveis na aplicação.
export type SourceId = (typeof sourceIds)[number];

// Labels para exibir na UI.
export const sourceLabels: Record<SourceId, string> = {
  github: "GitHub",
  jira: "Jira",
  stackoverflow: "Stack Overflow",
};

// O source que aparece por padrão ao abrir a aplicação.
export const defaultSourceId: SourceId = sourceIds[0];

// Mapeia id e label. Útil para dropdowns e formulários.
export const sourceOptions = sourceIds.map((id) => ({
  id,
  label: sourceLabels[id],
}));
