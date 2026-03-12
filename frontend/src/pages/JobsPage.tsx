import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, RefreshCw, RotateCcw, Square } from "lucide-react";

import { Button } from "@/components/button";
import { FormatDateItem } from "@/components/format-date-item";
import {
  FormatStatusItem,
  getFormatStatusItemInfo,
} from "@/components/format-status-item";
import { Loader } from "@/components/loader";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import { TablePaginationFooter } from "@/components/table-pagination-footer";
import { toast } from "@/components/toast";
import {
  getQueryErrorMessage,
  useJobsListQuery,
  useRestartCollectionMutation,
  useStopJobMutation,
} from "@/data";

export default function JobsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isReversed, setIsReversed] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [reloadIconAnimationKey, setReloadIconAnimationKey] = useState(0);
  const [isActionSyncPending, setIsActionSyncPending] = useState(false);
  const actionLockRef = useRef(false);

  const jobsQuery = useJobsListQuery();
  const stopJobMutation = useStopJobMutation();
  const restartCollectionMutation = useRestartCollectionMutation();

  // Pagination and sorting are purely visual state; they stay on this page only.
  const jobs = jobsQuery.data?.results ?? [];
  const orderedJobs = isReversed ? [...jobs].reverse() : jobs;
  const totalItems = orderedJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const pageStartIndex = (currentPage - 1) * rowsPerPage;
  const pageEndIndex = pageStartIndex + rowsPerPage;
  const paginatedJobs = orderedJobs.slice(pageStartIndex, pageEndIndex);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    // Auto-reloads the list every 5s (independent from manual reload).
    const intervalId = window.setInterval(() => {
      // Keeps visual feedback consistent: auto-reload also animates the icon.
      setReloadIconAnimationKey((value) => value + 1);
      void jobsQuery.refetch();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [jobsQuery.refetch]);

  // Action errors can come from either mutation, so read both and prioritize display.
  const actionError = stopJobMutation.isError
    ? stopJobMutation.error
    : restartCollectionMutation.isError
      ? restartCollectionMutation.error
      : null;
  const actionErrorMessage = actionError
    ? getQueryErrorMessage(actionError, "Failed to run job action.")
    : null;

  // While row action (stop/restart) is pending, disable row buttons to avoid concurrent actions.
  const isRowActionPending =
    stopJobMutation.isPending ||
    restartCollectionMutation.isPending ||
    isActionSyncPending;

  // Shows an error toast when an action fails.
  useEffect(() => {
    if (!actionErrorMessage) return;

    toast.error(undefined, {
      description: actionErrorMessage,
    });
  }, [actionErrorMessage]);

  // Shows a success toast when stop action succeeds.
  useEffect(() => {
    if (!stopJobMutation.isSuccess) return;

    toast.success(undefined, {
      description: "Task stopped successfully.",
    });
  }, [stopJobMutation.isSuccess]);

  // Shows a success toast when restart action succeeds.
  useEffect(() => {
    if (!restartCollectionMutation.isSuccess) return;

    toast.success(undefined, {
      description: "Task restarted successfully.",
    });
  }, [restartCollectionMutation.isSuccess]);

  function setActionLock(isLocked: boolean) {
    actionLockRef.current = isLocked;
    setIsActionSyncPending(isLocked);
  }

  // Utility that runs job actions (stop/restart) with a lock and refetches at the end.
  async function runJobAction(action: () => Promise<unknown>) {
    if (actionLockRef.current) return;

    setActionLock(true);

    try {
      await action();
      await jobsQuery.refetch();
    } catch {
      // Error toast uses mutation state, avoiding unhandled errors here.
    } finally {
      setActionLock(false);
    }
  }

  // Calls stop mutation (locks concurrent actions until runJobAction completes).
  function handleStopJob(taskId: string) {
    stopJobMutation.reset();
    restartCollectionMutation.reset();
    void runJobAction(() => stopJobMutation.mutateAsync(taskId));
  }

  // Calls restart mutation (locks concurrent actions until runJobAction completes).
  function handleRestartJob(taskId: string) {
    stopJobMutation.reset();
    restartCollectionMutation.reset();
    void runJobAction(() => restartCollectionMutation.mutateAsync(taskId));
  }

  // Reload button handler: triggers refetch and animates the icon.
  function handleReloadClick() {
    // Each click remounts the icon to replay the animation once.
    setReloadIconAnimationKey((value) => value + 1);
    void jobsQuery.refetch();
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Main page header: quick context of what this page shows. */}
      <PageHeader
        title="Jobs"
        subtitle="Monitor collection jobs, inspect raw records, and run simple retry/stop actions."
      />

      {/* Global page actions: visual sorting and list reload. */}
      <div className="mb-4 flex shrink-0 flex-wrap justify-end gap-2">
        <Button
          fullWidth={false}
          className="min-h-8.5 px-3 py-1"
          text={"Reverse order"}
          icon={<ArrowUpDown />}
          onClick={() => setIsReversed((value) => !value)}
        />

        <Button
          fullWidth={false}
          className="min-h-8.5 px-3 py-1"
          text="Reload"
          icon={
            <RefreshCw
              key={reloadIconAnimationKey}
              className={
                reloadIconAnimationKey > 0
                  ? "animate-[spin_700ms_linear_1]"
                  : ""
              }
            />
          }
          onClick={handleReloadClick}
          disabled={jobsQuery.isFetching}
        />
      </div>

      {/* Main card/block that groups feedback, table, and pagination controls. */}
      <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden rounded-xl border-2 border-(--color-secondary-soft) p-4">
        {/* Listing error: failed to fetch jobs (main page query). */}
        {jobsQuery.isError ? (
          <p className="shrink-0 text-sm text-(--color-red)">
            {getQueryErrorMessage(jobsQuery.error, "Failed to load jobs.")}
          </p>
        ) : null}

        {/* Jobs table (raw API fields, with date/status formatted by dedicated components). */}
        <div className="min-h-0 flex-1 overflow-auto">
          <Table>
            {/* Header for visible listing columns. */}
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead className="w-[40%]">Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* Initial loading state: occupies a full table row. */}
              {jobsQuery.isPending ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-2">
                    <div className="h-16">
                      <Loader />
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}

              {/* Empty state: query finished with no records. */}
              {!jobsQuery.isPending && paginatedJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center">
                    No jobs found.
                  </TableCell>
                </TableRow>
              ) : null}

              {/* Paginated data rows: renders only the current page slice. */}
              {!jobsQuery.isPending &&
                paginatedJobs.map((job) => {
                  // Status component centralizes color/label and exposes valid actions.
                  const statusInfo = getFormatStatusItemInfo(job.status);
                  const canStop = statusInfo.actions.stopActionActive;
                  const canRestart = statusInfo.actions.restartActionActive;

                  return (
                    <TableRow key={job.task_id}>
                      {/* Project */}
                      <TableCell className="font-medium">
                        {job.repository ?? ""}
                      </TableCell>
                      {/* Description (wraps line when too long). */}
                      <TableCell className="max-w-160 whitespace-normal wrap-break-word">
                        {job.operation ?? ""}
                      </TableCell>
                      {/* date */}
                      <TableCell>
                        <FormatDateItem
                          value={job.created_at_formatted ?? job.created_at}
                        />
                      </TableCell>
                      {/* Status */}
                      <TableCell>
                        <FormatStatusItem status={job.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Row actions: shown only when status allows them. */}
                        <div className="flex justify-end gap-2">
                          {canStop ? (
                            <Button
                              fullWidth={false}
                              className="w-9 min-h-8.5 px-0 py-0"
                              icon={<Square />}
                              aria-label={`Stop job ${job.task_id}`}
                              title="Stop job"
                              onClick={() => void handleStopJob(job.task_id)}
                              disabled={isRowActionPending}
                            />
                          ) : null}

                          {canRestart ? (
                            <Button
                              fullWidth={false}
                              className="w-9 min-h-8.5 px-0 py-0"
                              icon={<RotateCcw />}
                              aria-label={`Restart job ${job.task_id}`}
                              title="Restart job"
                              onClick={() => void handleRestartJob(job.task_id)}
                              disabled={isRowActionPending}
                            />
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>

        {/* Reusable table pagination footer. */}
        <div className="shrink-0">
          <TablePaginationFooter
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            totalItems={totalItems}
            itemsLabel="jobs"
            rowsPerPageSelectId="jobs-rows-per-page"
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(nextRowsPerPage) => {
              setRowsPerPage(nextRowsPerPage);
              setCurrentPage(1);
            }}
          />
        </div>
      </section>
    </section>
  );
}
