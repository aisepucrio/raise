// Simple format used for selects across different sources/screens.
export type SelectOption = {
  value: string;
  label: string;
};

type SelectEntity = {
  id: string;
  name: string;
};

// Maps dashboard entities to the option format used by `FormSelect`.
export function buildSelectOptions(
  items: readonly SelectEntity[] | null | undefined,
): SelectOption[] {
  const safeItems = Array.isArray(items) ? items : [];

  return safeItems.map((item) => ({
    value: item.id,
    label: item.name,
  }));
}
