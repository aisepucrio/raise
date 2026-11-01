/**
 * Extracts "owner/repo" from any github.com URL, including sub-path URLs
 * like issues, pull requests, or tree links.
 * Returns null if the input is not a recognisable GitHub URL.
 */
export function parseGithubUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed.toLowerCase().includes("github.com")) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (!url.hostname.toLowerCase().endsWith("github.com")) return null;

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;

    const repo = parts[1].replace(/\.git$/i, "");
    return `${parts[0]}/${repo}`;
  } catch {
    return null;
  }
}
