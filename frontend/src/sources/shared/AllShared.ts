// Simple format used for selects across different sources/screens.
export type SelectOption = {
  value: string;
  label: string;
};

// Maps backend items to the option format used by `FormSelect`.
//
// Why this exists:
// - avoids repeating `array.map(...)` in each source (GitHub/Jira/StackOverflow)
// - makes explicit which fields become `value` and `label`
//
// Example:
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
