import { describe, expect, it } from "vitest";

import { buildGithubCollectionParameters } from "./githubCollectParameters";

const noDates = { createdFrom: "", createdTo: "", updatedSince: "" };

describe("buildGithubCollectionParameters", () => {
  it("sends no GitHub enrichment for a commits-only collection", () => {
    expect(
      buildGithubCollectionParameters(["spf13/cobra"], ["git_commits"], noDates),
    ).toEqual({ urls: ["https://github.com/spf13/cobra"], commits: true });
  });

  it("sends only the selected GitHub resources, metadata included only if picked", () => {
    expect(
      buildGithubCollectionParameters(["spf13/cobra"], ["issues"], noDates),
    ).toEqual({
      urls: ["https://github.com/spf13/cobra"],
      enrich: { github: { resources: ["issues"] } },
    });
  });

  it("maps the dates to the creation window and updated-since", () => {
    expect(
      buildGithubCollectionParameters(
        ["spf13/cobra"],
        ["git_commits", "issues", "releases"],
        { createdFrom: "2024-01-01", createdTo: "2024-12-31", updatedSince: "2025-06-01" },
      ),
    ).toEqual({
      urls: ["https://github.com/spf13/cobra"],
      commits: true,
      enrich: {
        github: {
          resources: ["issues", "releases"],
          created_since: "2024-01-01T00:00:00Z",
          created_until: "2025-01-01T00:00:00Z",
          since: "2025-06-01T00:00:00Z",
        },
      },
    });
  });

  it("drops dates that don't apply to the selected resources", () => {
    // Releases can't be filtered by update time; metadata by neither.
    expect(
      buildGithubCollectionParameters(["spf13/cobra"], ["metadata", "releases"], {
        createdFrom: "",
        createdTo: "",
        updatedSince: "2025-06-01",
      }).enrich?.github,
    ).toEqual({ resources: ["metadata", "releases"] });
    expect(
      buildGithubCollectionParameters(["spf13/cobra"], ["metadata"], {
        createdFrom: "2024-01-01",
        createdTo: "",
        updatedSince: "",
      }).enrich?.github,
    ).toEqual({ resources: ["metadata"] });
  });
});
