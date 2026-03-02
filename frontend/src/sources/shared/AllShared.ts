// Formato simples usado por selects em diferentes fontes/telas.
export type SelectOption = {
  value: string;
  label: string;
};

// Mapeia itens vindos do backend para o formato de opcao usado por `FormSelect`.
//
// Por que existe:
// - evita repetir `array.map(...)` em cada source (GitHub/Jira/StackOverflow)
// - deixa explicito quais campos viram `value` e `label`
//
// Exemplo:
// `buildSelectOptions(repositories, {`
// `  getValue: (item) => item.id,`
// `  getLabel: (item) => item.repository,`
// `})`
export function buildSelectOptions<TItem>(
  items: readonly TItem[] | null | undefined,
  config: {
    getValue: (item: TItem) => string | number;
    getLabel: (item: TItem) => string;
  },
): SelectOption[] {
  const safeItems = Array.isArray(items) ? items : [];

  return safeItems.map((item) => ({
    value: String(config.getValue(item)),
    label: config.getLabel(item),
  }));
}
