import { describe, expect, it } from "vitest";

import type { Dashboard, DashboardGraphs } from "@/data";
import {
  buildDashboardCardItems,
  buildLineSeriesFromDashboardGraphs,
} from "./OverviewShared";

const dashboard: Dashboard = {
  platform: "github",
  entity: null,
  entities: [],
  cards: [
    { key: "issues", label: "Issues", type: "integer", value: 1234, windowed: true },
    { key: "stars", label: "Stars", type: "integer", value: null, windowed: false },
  ],
  last_mined_at: null,
};

describe("buildDashboardCardItems", () => {
  it("formats picked cards with the API's labels", () => {
    expect(
      buildDashboardCardItems(
        [
          { dashboard, key: "issues" },
          { dashboard, key: "stars" },
          { dashboard, key: "missing", title: "Missing" },
        ],
        false,
      ),
    ).toEqual([
      { title: "Issues", number: "1,234" },
      { title: "Stars", number: "-" },
      { title: "Missing", number: "-" },
    ]);
  });

  it("shows a placeholder while the dashboard loads", () => {
    expect(buildDashboardCardItems([{ dashboard: undefined, key: "issues" }], true)).toEqual([
      { title: "issues", number: "..." },
    ]);
  });
});

describe("buildLineSeriesFromDashboardGraphs", () => {
  it("aligns several platforms' series on the union of their buckets", () => {
    const git: DashboardGraphs = {
      platform: "git",
      entity: null,
      interval: "month",
      buckets: ["2024-01-01", "2024-02-01"],
      graphs: [
        {
          key: "activity",
          label: "Activity",
          cumulative: false,
          series: [
            { key: "commits", label: "Commits", values: [3, 4] },
            { key: "authors", label: "Active authors", values: [1, 2] },
          ],
        },
      ],
    };
    const github: DashboardGraphs = {
      platform: "github",
      entity: null,
      interval: "month",
      buckets: ["2024-02-01", "2024-03-01"],
      graphs: [
        {
          key: "activity",
          label: "Activity",
          cumulative: false,
          series: [
            { key: "issues_opened", label: "Issues opened", values: [5, 6] },
            { key: "releases", label: "Releases", values: [0, 0] },
          ],
        },
      ],
    };

    expect(
      buildLineSeriesFromDashboardGraphs([
        { graphs: git, key: "activity", series: ["commits"] },
        { graphs: github, key: "activity" },
      ]),
    ).toEqual([
      {
        id: "Commits",
        data: [
          { x: "2024-01-01", y: 3 },
          { x: "2024-02-01", y: 4 },
          { x: "2024-03-01", y: 0 },
        ],
      },
      // All-zero series (releases) are dropped.
      {
        id: "Issues opened",
        data: [
          { x: "2024-01-01", y: 0 },
          { x: "2024-02-01", y: 5 },
          { x: "2024-03-01", y: 6 },
        ],
      },
    ]);
  });
});
