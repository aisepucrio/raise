import type { DateFilterRange, StandardCollectBody } from "../shared";

export type StackOverflowPreviewParams = {
  page: number;
  page_size: number;
  question_id?: string;
  search?: string;
  ordering?: string;
  creation_date__gte?: string;
  creation_date__lte?: string;
};

export type StackOverflowOverviewParams = DateFilterRange & { tag?: string };
export type StackOverflowDateRangeParams = { tag?: string };

export type StackOverflowCollectFilters = {
  min?: number;
  max?: number;
  accepted?: boolean;
  answers?: number;
  views?: number;
  intitle?: string;
  closed?: boolean;
  migrated?: boolean;
  nottagged?: string;
  user?: string;
};

export type StackOverflowCollectOptions = {
  mode?: "default" | "advanced";
};

export type StackOverflowCollectBody = StandardCollectBody<
  "questions",
  StackOverflowCollectFilters,
  StackOverflowCollectOptions
>;

export type StackOverflowPreviewRow = Record<string, unknown>;

export type StackOverflowPreviewResponse = {
  count?: number;
  results?: StackOverflowPreviewRow[];
};
