// Extract error text from nested objects.
function extractErrorText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  // huma problem details: `detail`, plus per-field `errors` on validation.
  if ("detail" in value) {
    const detailText = extractErrorText((value as { detail?: unknown }).detail);
    const fieldErrors = (value as { errors?: unknown }).errors;
    const fieldText = Array.isArray(fieldErrors)
      ? fieldErrors
          .map((fieldError) => {
            const { message, location } = (fieldError ?? {}) as {
              message?: unknown;
              location?: unknown;
            };
            if (typeof message !== "string") return null;
            return typeof location === "string"
              ? `${location}: ${message}`
              : message;
          })
          .filter(Boolean)
          .join("; ")
      : "";
    if (detailText && fieldText) return `${detailText} (${fieldText})`;
    if (detailText) return detailText;
  }

  if ("error" in value) {
    const errorText = extractErrorText((value as { error?: unknown }).error);
    if (errorText) return errorText;
  }

  if ("message" in value) {
    const messageText = extractErrorText(
      (value as { message?: unknown }).message,
    );
    if (messageText) return messageText;
  }

  return null;
}

// Format Axios/API errors into the simple UI message.
export function getQueryErrorMessage(
  error: unknown,
  fallbackMessage = "Error loading data.",
) {
  if (error && typeof error === "object" && "data" in error) {
    const apiError = error as { data?: unknown };
    const apiErrorText = extractErrorText(apiError.data);

    if (apiErrorText) return apiErrorText;
  }

  const directErrorText = extractErrorText(error);
  if (directErrorText) return directErrorText;

  if (error instanceof Error) return error.message;

  return fallbackMessage;
}
