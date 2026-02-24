// Formata erros vindos do axios/api para uma mensagem simples na UI.
export function getQueryErrorMessage(
  error: unknown,
  fallbackMessage = "Erro ao carregar dados.",
) {
  if (error && typeof error === "object" && "data" in error) {
    const apiError = error as { data?: unknown };

    if (apiError.data !== undefined) {
      return JSON.stringify(apiError.data);
    }
  }

  if (error instanceof Error) return error.message;

  return fallbackMessage;
}
