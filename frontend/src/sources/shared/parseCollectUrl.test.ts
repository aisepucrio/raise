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
});

// ── parseJiraUrl ──────────────────────────────────────────────────────────────

describe("parseJiraUrl", () => {
  it("extracts domain and key from a board URL", () => {
    expect(
      parseJiraUrl(
        "https://stone-puc.atlassian.net/jira/software/c/projects/APIMINER/boards/3",
      ),
    ).toEqual({ jira_domain: "stone-puc.atlassian.net", project_key: "APIMINER" });
  });
  it("extracts domain and key from a board URL with query params", () => {
    expect(
      parseJiraUrl(
        "https://stone-puc.atlassian.net/jira/software/c/projects/APIMINER/boards/3?assignee=abc&selectedIssue=APIMINER-701",
      ),
    ).toEqual({ jira_domain: "stone-puc.atlassian.net", project_key: "APIMINER" });
  });
  it("extracts domain and key from a browse/issue URL", () => {
    expect(
      parseJiraUrl("https://stone-puc.atlassian.net/browse/APIMINER-701"),
    ).toEqual({ jira_domain: "stone-puc.atlassian.net", project_key: "APIMINER" });
  });
  it("extracts domain and key from a backlog URL", () => {
    expect(
      parseJiraUrl(
        "https://stone-puc.atlassian.net/jira/software/projects/APIMINER/backlogs",
      ),
    ).toEqual({ jira_domain: "stone-puc.atlassian.net", project_key: "APIMINER" });
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
});
