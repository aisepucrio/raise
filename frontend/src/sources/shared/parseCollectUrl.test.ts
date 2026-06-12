import { describe, expect, it } from "vitest";
import {
  parseGithubUrl,
  parseJiraUrl,
  parseStackOverflowUrl,
} from "./parseCollectUrl";

// ── parseGithubUrl ────────────────────────────────────────────────────────────

describe("parseGithubUrl", () => {
  it("returns owner/repo from a plain repo URL", () => {
    expect(parseGithubUrl("https://github.com/facebook/react")).toBe(
      "facebook/react",
    );
  });
  it("returns owner/repo from an issues URL", () => {
    expect(
      parseGithubUrl("https://github.com/facebook/react/issues/123"),
    ).toBe("facebook/react");
  });
  it("returns owner/repo from a pull request URL", () => {
    expect(parseGithubUrl("https://github.com/facebook/react/pull/456")).toBe(
      "facebook/react",
    );
  });
  it("returns owner/repo from a tree URL", () => {
    expect(
      parseGithubUrl("https://github.com/facebook/react/tree/main"),
    ).toBe("facebook/react");
  });
  it("returns owner/repo from a protocol-less github.com URL", () => {
    expect(parseGithubUrl("github.com/facebook/react/issues/1")).toBe(
      "facebook/react",
    );
  });
  it("returns null for plain owner/repo text", () => {
    expect(parseGithubUrl("facebook/react")).toBeNull();
  });
  it("returns null for non-GitHub URLs", () => {
    expect(parseGithubUrl("https://gitlab.com/facebook/react")).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(parseGithubUrl("")).toBeNull();
  });
  it("strips .git suffix from clone URLs", () => {
    expect(parseGithubUrl("https://github.com/owner/repo.git")).toBe(
      "owner/repo",
    );
  });
  it("returns null for SSH clone URL", () => {
    expect(parseGithubUrl("git@github.com:owner/repo.git")).toBeNull();
  });
  it("returns null for owner-only URL (no repo segment)", () => {
    expect(parseGithubUrl("https://github.com/owner")).toBeNull();
  });
  it("handles trailing slash on repo URL", () => {
    expect(parseGithubUrl("https://github.com/owner/repo/")).toBe(
      "owner/repo",
    );
  });
  it("returns owner/repo from a releases URL", () => {
    expect(
      parseGithubUrl("https://github.com/owner/repo/releases/tag/v1.0.0"),
    ).toBe("owner/repo");
  });
  it("trims surrounding whitespace", () => {
    expect(parseGithubUrl("  https://github.com/owner/repo  ")).toBe(
      "owner/repo",
    );
  });
});

describe("parseJiraUrl", () => {
  it("extracts target from a board URL", () => {
    expect(
      parseJiraUrl(
        "https://stone-puc.atlassian.net/jira/software/c/projects/APIMINER/boards/3",
      ),
    ).toBe("stone-puc.atlassian.net/APIMINER");
  });
  it("extracts target from a board URL with query params", () => {
    expect(
      parseJiraUrl(
        "https://stone-puc.atlassian.net/jira/software/c/projects/APIMINER/boards/3?assignee=abc&selectedIssue=APIMINER-701",
      ),
    ).toBe("stone-puc.atlassian.net/APIMINER");
  });
  it("extracts target from a browse/issue URL", () => {
    expect(
      parseJiraUrl("https://stone-puc.atlassian.net/browse/APIMINER-701"),
    ).toBe("stone-puc.atlassian.net/APIMINER");
  });
  it("extracts target from a backlog URL", () => {
    expect(
      parseJiraUrl(
        "https://stone-puc.atlassian.net/jira/software/projects/APIMINER/backlogs",
      ),
    ).toBe("stone-puc.atlassian.net/APIMINER");
  });
  it("returns null for a protocol-less domain string", () => {
    expect(parseJiraUrl("stone-puc.atlassian.net")).toBeNull();
  });
  it("returns null for a Jira URL with no recognisable project key", () => {
    expect(
      parseJiraUrl("https://stone-puc.atlassian.net/jira/dashboards"),
    ).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(parseJiraUrl("")).toBeNull();
  });
  it("extracts from a self-hosted (non-Atlassian) Jira URL", () => {
    expect(
      parseJiraUrl("https://jira.company.com/browse/PROJ-123"),
    ).toBe("jira.company.com/PROJ");
  });
  it("extracts from a browse URL with no issue number", () => {
    expect(
      parseJiraUrl("https://stone-puc.atlassian.net/browse/APIMINER"),
    ).toBe("stone-puc.atlassian.net/APIMINER");
  });
  it("extracts from a roadmap URL", () => {
    expect(
      parseJiraUrl(
        "https://stone-puc.atlassian.net/jira/software/projects/APIMINER/roadmap",
      ),
    ).toBe("stone-puc.atlassian.net/APIMINER");
  });
  it("uppercases a lowercase project key", () => {
    expect(
      parseJiraUrl("https://stone-puc.atlassian.net/browse/apiminer-42"),
    ).toBe("stone-puc.atlassian.net/APIMINER");
  });
  it("trims surrounding whitespace", () => {
    expect(
      parseJiraUrl(
        "  https://stone-puc.atlassian.net/browse/APIMINER-701  ",
      ),
    ).toBe("stone-puc.atlassian.net/APIMINER");
  });
});

// ── parseStackOverflowUrl ─────────────────────────────────────────────────────

describe("parseStackOverflowUrl", () => {
  it("extracts a simple tag from a tagged URL", () => {
    expect(
      parseStackOverflowUrl(
        "https://stackoverflow.com/questions/tagged/javascript",
      ),
    ).toBe("javascript");
  });
  it("extracts a hyphenated tag", () => {
    expect(
      parseStackOverflowUrl(
        "https://stackoverflow.com/questions/tagged/react-hooks",
      ),
    ).toBe("react-hooks");
  });
  it("returns null for plain tag text", () => {
    expect(parseStackOverflowUrl("javascript")).toBeNull();
  });
  it("returns null for a non-tagged Stack Overflow URL", () => {
    expect(
      parseStackOverflowUrl(
        "https://stackoverflow.com/questions/12345/some-question",
      ),
    ).toBeNull();
  });
  it("returns null for a non-Stack Overflow URL", () => {
    expect(
      parseStackOverflowUrl("https://github.com/questions/tagged/javascript"),
    ).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(parseStackOverflowUrl("")).toBeNull();
  });
  it("decodes URL-encoded tag (c# → c%23)", () => {
    expect(
      parseStackOverflowUrl(
        "https://stackoverflow.com/questions/tagged/c%23",
      ),
    ).toBe("c#");
  });
  it("decodes URL-encoded tag (c++ → c%2B%2B)", () => {
    expect(
      parseStackOverflowUrl(
        "https://stackoverflow.com/questions/tagged/c%2B%2B",
      ),
    ).toBe("c++");
  });
  it("handles tag with dot (node.js)", () => {
    expect(
      parseStackOverflowUrl(
        "https://stackoverflow.com/questions/tagged/node.js",
      ),
    ).toBe("node.js");
  });
  it("ignores query params and returns just the tag", () => {
    expect(
      parseStackOverflowUrl(
        "https://stackoverflow.com/questions/tagged/javascript?tab=newest&page=2",
      ),
    ).toBe("javascript");
  });
  it("handles trailing slash on tag URL", () => {
    expect(
      parseStackOverflowUrl(
        "https://stackoverflow.com/questions/tagged/javascript/",
      ),
    ).toBe("javascript");
  });
});
