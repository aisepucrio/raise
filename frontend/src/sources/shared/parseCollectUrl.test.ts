import { describe, expect, it } from "vitest";
import { parseGithubUrl } from "./parseCollectUrl";

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
