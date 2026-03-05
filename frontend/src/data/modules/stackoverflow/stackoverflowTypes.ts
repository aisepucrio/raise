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

// response of the dashboard/overview (cards + list of questions).
export type StackOverflowOverviewQuestion = {
  id?: string | number;
  question_id?: string | number;
  title?: string;
  question_title?: string;
  question?: string;
  display?: string;
};

export type StackOverflowOverviewResponse = {
  questions_count?: number;
  answers_count?: number;
  comments_count?: number;
  tags_count?: number;
  questions?: StackOverflowOverviewQuestion[];
  time_mined?: string | null;
};

export type StackOverflowOverviewParams = DateFilterRange & { question_id?: string };
export type StackOverflowDateRangeParams = { question_id: string };
export type StackOverflowGraphParams = DateFilterRange & {
  interval: "day" | "month" | "year";
};

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
