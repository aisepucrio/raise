export type JobsListItem = {
  task_id: string;
  operation: string;
  repository: string;
  created_at: string;
  created_at_formatted: string;
  status: string;
  error?: string | null;
};

export type JobsListResponse = {
  count: number;
  results: JobsListItem[];
};
