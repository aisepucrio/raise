import { useMemo } from "react";

import { FormatDateItem } from "@/components/format-date-item";
import { Loader } from "@/components/loader";
import { ModalShell } from "@/components/modal-shell";
import {
  getQueryErrorMessage,
  useCollectionErrorsQuery,
  type Collection,
  type CollectionJobError,
} from "@/data";

// The API returns at most this many errors per request.
const MAX_ERRORS = 1000;

type CollectionLogModalProps = {
  collection: Collection | null;
  onClose: () => void;
};

// A collection's failed job attempts, grouped by job kind. Retried attempts
// show for finished collections too: a `completed` collection can have jobs
// that failed once and then succeeded.
export default function CollectionLogModal({
  collection,
  onClose,
}: CollectionLogModalProps) {
  const isRunning = collection?.status === "running";
  const errorsQuery = useCollectionErrorsQuery(collection?.id ?? null, {
    isRunning,
  });
  const errors = errorsQuery.data ?? [];

  // Job kinds in order of first failure, each with its attempts.
  const groups = useMemo(() => {
    const byKind = new Map<string, CollectionJobError[]>();
    for (const error of errorsQuery.data ?? []) {
      const list = byKind.get(error.job_kind) ?? [];
      list.push(error);
      byKind.set(error.job_kind, list);
    }
    return [...byKind.entries()];
  }, [errorsQuery.data]);

  const finalCount = errors.filter((e) => e.is_final).length;
  const jobCount = new Set(errors.map((e) => e.job_id)).size;

  return (
    <ModalShell
      open={collection !== null}
      onClose={onClose}
      size="lg"
      title={collection ? `Collection #${collection.id} log` : "Collection log"}
      subtitle={
        isRunning
          ? "Still running: the log updates every five seconds."
          : "Failed job attempts. Rate-limit pauses are normal and not listed."
      }
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-auto pr-1">
        {errorsQuery.isPending ? (
          <div className="h-16">
            <Loader />
          </div>
        ) : null}

        {errorsQuery.isError ? (
          <p className="text-sm text-(--color-red)">
            {getQueryErrorMessage(errorsQuery.error, "Failed to load the log.")}
          </p>
        ) : null}

        {errorsQuery.isSuccess && errors.length === 0 ? (
          <p className="text-sm text-(--color-secondary)">
            {isRunning
              ? "No errors so far."
              : "No errors: every job succeeded on its first attempt."}
          </p>
        ) : null}

        {errors.length > 0 ? (
          <p className="text-sm text-(--color-secondary)">
            {errors.length.toLocaleString("en-US")} failed attempt
            {errors.length === 1 ? "" : "s"} in{" "}
            {jobCount.toLocaleString("en-US")} job
            {jobCount === 1 ? "" : "s"}:{" "}
            <span
              className={
                finalCount > 0 ? "font-semibold text-(--color-rose)" : undefined
              }
            >
              {finalCount} given up
            </span>
            , {errors.length - finalCount} retried.
            {errors.length >= MAX_ERRORS
              ? ` Showing the first ${MAX_ERRORS.toLocaleString("en-US")}.`
              : ""}
          </p>
        ) : null}

        {groups.map(([kind, kindErrors]) => (
          <section key={kind} className="space-y-2">
            <h3 className="font-mono text-sm font-semibold text-(--color-secondary)">
              {kind}{" "}
              <span className="font-sans font-normal text-(--color-secondary-muted)">
                ({kindErrors.length})
              </span>
            </h3>
            <ul className="space-y-2">
              {kindErrors.map((error) => (
                <li
                  key={error.id}
                  className="space-y-1 rounded-lg border border-(--color-secondary-soft) p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--color-secondary-muted)">
                    <span
                      className="font-semibold"
                      style={{
                        color: error.is_final
                          ? "var(--color-rose)"
                          : "var(--color-amber)",
                      }}
                    >
                      {error.is_final ? "Given up" : "Retried"}
                    </span>
                    <span>Attempt {error.attempt}</span>
                    <span>Job {error.job_id}</span>
                    <FormatDateItem value={error.created_at} />
                  </div>
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs text-(--color-secondary)">
                    {error.error}
                  </pre>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-(--color-secondary-muted)">
                      Job arguments
                    </summary>
                    <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-(--color-secondary-muted)">
                      {JSON.stringify(error.job_args, null, 2)}
                    </pre>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </ModalShell>
  );
}
