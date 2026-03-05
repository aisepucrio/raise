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

  // pagination and sorting are state puramente visual; stay in this page and not leak for the date layer.
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
    // Auto-reload of the listing the each 5s (independente of the button manual).
    const intervalId = window.setInterval(() => {
      // keeps feedback visual consistent: auto-reload also animatestes the icon.
      setReloadIconAnimationKey((value) => value + 1);
      void jobsQuery.refetch();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [jobsQuery.refetch]);

  // the error of action pode vir of any the of the mutations, then reads both and prioriza the display.
  const actionError = stopJobMutation.isError
    ? stopJobMutation.error
    : restartCollectionMutation.isError
      ? restartCollectionMutation.error
      : null;
  const actionErrorMessage = actionError
    ? getQueryErrorMessage(actionError, "Failed to run job action.")
    : null;

  // While the action of row (stop/restart) is pending, disables the buttons dessa row to avoid actions concurrent.
  const isRowActionPending =
    stopJobMutation.isPending ||
    restartCollectionMutation.isPending ||
    isActionSyncPending;

  // Effect to trigger toast of error when the action failure.
  useEffect(() => {
    if (!actionErrorMessage) return;

    toast.error(undefined, {
      description: actionErrorMessage,
    });
  }, [actionErrorMessage]);

  // Effect to trigger toast of error when the action of stop task is successful.
  useEffect(() => {
    if (!stopJobMutation.isSuccess) return;

    toast.success(undefined, {
      description: "Task stopped successfully.",
    });
  }, [stopJobMutation.isSuccess]);

  // Effect to trigger toast of error when the action of restart task is successful.
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

  // function utility to run the action of job (stop/restart) with lock to avoid concurrency and refetch of the listing at the end.
  async function runJobAction(action: () => Promise<unknown>) {
    if (actionLockRef.current) return;

    setActionLock(true);

    try {
      await action();
      await jobsQuery.refetch();
    } catch {
      // the toast of error usa the state of the mutation; avoids error not tratado in the handler.
    } finally {
      setActionLock(false);
    }
  }

  // Calls mutation of stop (and locks actions concurrent until complete with runJobAction).
  function handleStopJob(taskId: string) {
    stopJobMutation.reset();
    restartCollectionMutation.reset();
    void runJobAction(() => stopJobMutation.mutateAsync(taskId));
  }

  // Calls mutation of restart (and locks actions concurrent until complete with runJobAction).
  function handleRestartJob(taskId: string) {
    stopJobMutation.reset();
    restartCollectionMutation.reset();
    void runJobAction(() => restartCollectionMutation.mutateAsync(taskId));
  }

  // Handler of click of the button of reload: triggers refetch and animatestes the icon.
  function handleReloadClick() {
    // each click reBuilds the icon to run the animatestestion the single vez.
    setReloadIconAnimationKey((value) => value + 1);
    void jobsQuery.refetch();
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* header main of the screen: context quick of the that esta page displays. */}
      <PageHeader
        title="Jobs"
        subtitle="Monitor collection jobs, inspect raw records, and run simple retry/stop actions."
      />

      {/* actions global of the screen: sorting visual and reload of the consulta. */}
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

      {/* Card/block main that agrupa feedbacks, table and controles of pagination. */}
      <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden rounded-xl border-2 border-(--color-secondary-soft) p-4">
        {/* error of the listing: failure to fetch jobs (query main of the page). */}
        {jobsQuery.isError ? (
          <p className="shrink-0 text-sm text-(--color-red)">
            {getQueryErrorMessage(jobsQuery.error, "Failed to load jobs.")}
          </p>
        ) : null}

        {/* table of jobs (fields crus of the API, with date/status formatados for components dedicados). */}
        <div className="min-h-0 flex-1 overflow-auto">
          <Table>
            {/* header of the columns visible in the listing. */}
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
              {/* state of loading initial of the query: occupies the row entire of the table. */}
              {jobsQuery.isPending ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-2">
                    <div className="h-16">
                      <Loader />
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}

              {/* state empty: query completed without records for display. */}
              {!jobsQuery.isPending && paginatedJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center">
                    No jobs found.
                  </TableCell>
                </TableRow>
              ) : null}

              {/* rows of date paginadas: renderiza only the recorte of the page atual. */}
              {!jobsQuery.isPending &&
                paginatedJobs.map((job) => {
                  // the component of status centraliza color/label and also exposes the actions valid.
                  const statusInfo = getFormatStatusItemInfo(job.status);
                  const canStop = statusInfo.actions.stopActionActive;
                  const canRestart = statusInfo.actions.restartActionActive;

                  return (
                    <TableRow key={job.task_id}>
                      {/* Project */}
                      <TableCell className="font-medium">
                        {job.repository ?? ""}
                      </TableCell>
                      {/* Description (quebra row se muito grande) */}
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
                        {/* actions of the row: only appear when the status permite. */}
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

        {/* footer reusable of pagination of the table. */}
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
