import type { DateFilterRange } from "../shared";

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

export type StackOverflowCollectBody = {
  options: ["collect_questions"];
  start_date: string;
  end_date: string;
  tags?: string;
};

export type StackOverflowAdvancedCollectFilters = {
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

export type StackOverflowAdvancedCollectBody = StackOverflowCollectBody & {
  mode: "advanced";
  filters?: StackOverflowAdvancedCollectFilters;
};

export type StackOverflowPreviewRow = Record<string, unknown>;

export type StackOverflowPreviewResponse = {
  count?: number;
  results?: StackOverflowPreviewRow[];
};
