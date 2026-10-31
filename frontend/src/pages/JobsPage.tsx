import { useEffect, useRef, useState } from "react";
import {
  ArrowUpDown,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Square,
} from "lucide-react";

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
  hasRole,
  useCancelCollectionMutation,
  useCollectionsQuery,
  useMeQuery,
  useRepositoriesQuery,
  useStartCollectionMutation,
  type Collection,
  type Repository,
} from "@/data";
import CollectionLogModal from "./CollectionLogModal";

// Repositories a collection covers, by name where the ID is known.
function describeCollectionRepositories(
  collection: Collection,
  repositoriesById: Map<number, Repository>,
) {
  const { url, urls, repository_id, repository_ids } =
    collection.parameters as {
      url?: string;
      urls?: string[];
      repository_id?: number;
      repository_ids?: number[];
    };
  const names = new Set<string>();
  for (const value of [url, ...(urls ?? [])]) {
    if (value) names.add(value.replace(/^https?:\/\//, ""));
  }
  for (const id of [repository_id, ...(repository_ids ?? [])]) {
    if (id === undefined) continue;
    const repository = repositoriesById.get(id);
    names.add(repository ? `${repository.host}/${repository.path}` : `#${id}`);
  }
  return [...names].join(", ");
}

// What a collection mines, e.g. "commits, github: metadata, issues".
function describeCollectionScope(collection: Collection) {
  const { commits, enrich } = collection.parameters as {
    commits?: boolean;
    enrich?: Record<string, { resources?: string[] }>;
  };
  const parts: string[] = [];
  if (commits) parts.push("commits");
  for (const [platform, request] of Object.entries(enrich ?? {})) {
    parts.push(`${platform}: ${(request.resources ?? []).join(", ")}`);
  }
  return `#${collection.id} ${collection.platform} · ${parts.join("; ") || "no data selected"}`;
}

export default function JobsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isReversed, setIsReversed] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [reloadIconAnimationKey, setReloadIconAnimationKey] = useState(0);
  const [isActionSyncPending, setIsActionSyncPending] = useState(false);
  const actionLockRef = useRef(false);

  // The collection whose log is open, by ID so it follows list refreshes.
  const [logCollectionId, setLogCollectionId] = useState<number | null>(null);

  // Polls while a collection is running.
  const jobsQuery = useCollectionsQuery();
  const repositoriesQuery = useRepositoriesQuery();
  const stopJobMutation = useCancelCollectionMutation();
  const restartCollectionMutation = useStartCollectionMutation();
  const { data: currentUser } = useMeQuery();
  // Cancelling and re-running need the researcher role.
  const canManage = hasRole(currentUser?.role, "researcher");
  const repositoriesById = new Map(
    (repositoriesQuery.data ?? []).map((repository) => [
      repository.id,
      repository,
    ]),
  );

  // Pagination and sorting are purely visual state; they stay on this page only.
  const jobs = jobsQuery.data ?? [];
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
      description: "Collection cancelled.",
    });
  }, [stopJobMutation.isSuccess]);

  // Shows a success toast when restart action succeeds.
  useEffect(() => {
    if (!restartCollectionMutation.isSuccess) return;

    toast.success(undefined, {
      description: "Collection started again. It mines only what's new.",
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

  // Cancels a running collection (locks concurrent actions until runJobAction completes).
  function handleStopJob(collection: Collection) {
    stopJobMutation.reset();
    restartCollectionMutation.reset();
    void runJobAction(() => stopJobMutation.mutateAsync(collection.id));
  }

  // There is no restart endpoint: a new collection with the same parameters
  // re-runs it, and mines only what's new.
  function handleRestartJob(collection: Collection) {
    stopJobMutation.reset();
    restartCollectionMutation.reset();
    void runJobAction(() =>
      restartCollectionMutation.mutateAsync({
        platform: collection.platform,
        parameters: collection.parameters,
      }),
    );
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
        subtitle="Monitor collections, cancel running ones, or run a finished one again to mine what's new."
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
            {getQueryErrorMessage(
              jobsQuery.error,
              "Failed to load collections.",
            )}
          </p>
        ) : null}

        {/* Jobs table (raw API fields, with date/status formatted by dedicated components). */}
        <div className="min-h-0 flex-1 overflow-auto">
          <Table>
            {/* Header for visible listing columns. */}
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead className="w-[35%]">Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* Initial loading state: occupies a full table row. */}
              {jobsQuery.isPending ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-2">
                    <div className="h-16">
                      <Loader />
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}

              {/* Empty state: query finished with no records. */}
              {!jobsQuery.isPending && paginatedJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center">
                    No collections yet.
                  </TableCell>
                </TableRow>
              ) : null}

              {/* Paginated data rows: renders only the current page slice. */}
              {!jobsQuery.isPending &&
                paginatedJobs.map((job) => {
                  // Status component centralizes color/label and exposes valid actions.
                  const statusInfo = getFormatStatusItemInfo(job.status);
                  const canStop =
                    canManage && statusInfo.actions.stopActionActive;
                  const canRestart =
                    canManage && statusInfo.actions.restartActionActive;
                  const { jobs_done, jobs_expected, jobs_failed } =
                    job.progress;

                  return (
                    <TableRow key={job.id}>
                      {/* Project */}
                      <TableCell className="max-w-80 whitespace-normal wrap-break-word font-medium">
                        {describeCollectionRepositories(job, repositoriesById)}
                      </TableCell>
                      {/* Description (wraps line when too long). */}
                      <TableCell className="max-w-160 whitespace-normal wrap-break-word">
                        {describeCollectionScope(job)}
                      </TableCell>
                      {/* date */}
                      <TableCell>
                        <FormatDateItem value={job.created_at} />
                      </TableCell>
                      {/* Jobs settled so far; the expected count grows as jobs fan out. */}
                      <TableCell>
                        {jobs_done}/{jobs_expected}
                        {jobs_failed > 0 ? (
                          <span className="text-(--color-rose)">
                            {" "}
                            ({jobs_failed} failed)
                          </span>
                        ) : null}
                      </TableCell>
                      {/* Status */}
                      <TableCell>
                        <FormatStatusItem status={job.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Row actions: shown only when status allows them. */}
                        <div className="flex justify-end gap-2">
                          {/* Every role can read the log, in any status. */}
                          <Button
                            fullWidth={false}
                            className="w-9 min-h-8.5 px-0 py-0"
                            icon={<ScrollText />}
                            aria-label={`View log of collection ${job.id}`}
                            title="View log"
                            onClick={() => setLogCollectionId(job.id)}
                          />
                          {canStop ? (
                            <Button
                              fullWidth={false}
                              className="w-9 min-h-8.5 px-0 py-0"
                              icon={<Square />}
                              aria-label={`Cancel collection ${job.id}`}
                              title="Cancel collection"
                              onClick={() => void handleStopJob(job)}
                              disabled={isRowActionPending}
                            />
                          ) : null}

                          {canRestart ? (
                            <Button
                              fullWidth={false}
                              className="w-9 min-h-8.5 px-0 py-0"
                              icon={<RotateCcw />}
                              aria-label={`Run collection ${job.id} again`}
                              title="Run again"
                              onClick={() => void handleRestartJob(job)}
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
            itemsLabel="collections"
            rowsPerPageSelectId="jobs-rows-per-page"
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(nextRowsPerPage) => {
              setRowsPerPage(nextRowsPerPage);
              setCurrentPage(1);
            }}
          />
        </div>
      </section>

      <CollectionLogModal
        collection={jobs.find((job) => job.id === logCollectionId) ?? null}
        onClose={() => setLogCollectionId(null)}
      />
    </section>
  );
}
