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

    return `${parts[0]}/${parts[1]}`;
  } catch {
    return null;
  }
}

/**
 * Extracts { jira_domain, project_key } from a Jira URL.
 * Supports project/board URLs (.../projects/KEY/...) and
 * browse/issue URLs (.../browse/KEY-123).
 * Returns null if the input is not a parseable Jira URL.
 */
export function parseJiraUrl(
  input: string,
): { jira_domain: string; project_key: string } | null {
  const trimmed = input.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;

  try {
    const url = new URL(trimmed);
    const domain = url.hostname;

    // /projects/KEY/ or /projects/KEY (end of path)
    const projectsMatch = url.pathname.match(
      /\/projects\/([A-Z][A-Z0-9_]*)(?:\/|$)/i,
    );
    if (projectsMatch) {
      return { jira_domain: domain, project_key: projectsMatch[1].toUpperCase() };
    }

    // /browse/KEY-123 or /browse/KEY
    const browseMatch = url.pathname.match(
      /\/browse\/([A-Z][A-Z0-9_]*)(?:-\d+)?(?:\/|$)/i,
    );
    if (browseMatch) {
      return { jira_domain: domain, project_key: browseMatch[1].toUpperCase() };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extracts a tag name from a Stack Overflow tagged URL.
 * e.g. https://stackoverflow.com/questions/tagged/javascript → "javascript"
 * Returns null if the input is not a recognisable Stack Overflow tag URL.
 */
export function parseStackOverflowUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;

  try {
    const url = new URL(trimmed);
    if (!url.hostname.toLowerCase().includes("stackoverflow.com")) return null;

    const match = url.pathname.match(/\/questions\/tagged\/([^/]+)/);
    if (match) return decodeURIComponent(match[1]);

    return null;
  } catch {
    return null;
  }
}
