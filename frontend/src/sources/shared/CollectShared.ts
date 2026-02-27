/**
 * Verifica se a lista ja contem um item, ignorando maiusculas/minusculas.
 * O item comparado nesta funcao e uma string.
 * Evita duplicados visuais como "Owner/Repo" e "owner/repo".
 */
export function containsItemIgnoreCase(
  list: readonly string[],
  value: string,
): boolean {
  const normalizedValue = value.toLowerCase();

  for (const currentItem of list) {
    const normalizedCurrentItem = currentItem.toLowerCase();

    if (normalizedCurrentItem === normalizedValue) {
      return true;
    }
  }

  return false;
}
