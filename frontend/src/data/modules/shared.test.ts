import { describe, expect, it } from "vitest";

import { toDatasetSearchParams } from "./datasets/datasetTypes";
import { mergeDateRanges, toApiSince, toApiUntil } from "./shared";

describe("toApiSince / toApiUntil", () => {
  it("turns inclusive date inputs into the API's [since, until) window", () => {
    expect(toApiSince("2024-01-01")).toBe("2024-01-01T00:00:00Z");
    expect(toApiUntil("2024-01-31")).toBe("2024-02-01T00:00:00Z");
    expect(toApiUntil("2024-12-31")).toBe("2025-01-01T00:00:00Z");
  });

  it("leaves empty or invalid dates out", () => {
    expect(toApiSince("")).toBeUndefined();
    expect(toApiUntil("")).toBeUndefined();
    expect(toApiUntil("not-a-date")).toBeUndefined();
  });
});

describe("mergeDateRanges", () => {
  it("takes the earliest first_at and latest last_at as UTC dates", () => {
    const bounds = mergeDateRanges([
      { platform: "git", entity: null, first_at: "2013-09-03T17:40:26-03:00", last_at: "2026-07-10T21:43:07-03:00" },
      { platform: "github", entity: null, first_at: "2015-01-01T00:00:00Z", last_at: "2026-08-01T00:00:00Z" },
    ]);
    expect(bounds).toEqual({ minDate: "2013-09-03", maxDate: "2026-08-01" });
  });

  it("ignores platforms without data", () => {
    expect(
      mergeDateRanges([
        undefined,
        { platform: "github", entity: null, first_at: null, last_at: null },
      ]),
    ).toEqual({ minDate: undefined, maxDate: undefined });
  });
});

describe("toDatasetSearchParams", () => {
  it("repeats column filters with several values and drops empty ones", () => {
    const params = toDatasetSearchParams({
      search: "",
      sort: "-github_created_at",
      since: "2024-01-01",
      limit: 10,
      cursor: "abc",
      columns: { repository_id: "1", label_names: ["bug", "ui"] },
    });
    expect(params.toString()).toBe(
      "sort=-github_created_at&since=2024-01-01&limit=10&cursor=abc&repository_id=1&label_names=bug&label_names=ui",
    );
  });
});
