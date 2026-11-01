import { useMemo, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ExternalLink, Trash2 } from "lucide-react";

import { Button } from "@/components/button";
import { FormatDateItem } from "@/components/format-date-item";
import { FormInput } from "@/components/form";
import { Loader } from "@/components/loader";
import { ModalShell } from "@/components/modal-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import { toast } from "@/components/toast";
import { WarningBox } from "@/components/warning-box";
import {
  getQueryErrorMessage,
  useDeleteRepositoryMutation,
  useRemoveRepositoryDataMutation,
  useRepositoriesQuery,
  useRepositoryDataQuery,
  type Repository,
  type RepositoryData,
  type RepositoryDataPart,
} from "@/data";

const PLATFORM_LABELS: Record<string, string> = {
  git: "Git",
  github: "GitHub",
  gitlab: "GitLab",
};

const formatCount = new Intl.NumberFormat("en-US").format;

// The GitHub source's entities page (/entities?source=github): registered
// repositories and what was mined for each (backend-go README,
// Managing repositories). Admins remove a repository with everything mined
// for it, or one part of its data. Commits are shared between forks, so
// items another repository also contains are kept for it.
export default function GithubRepositories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState("");
  const repositoriesQuery = useRepositoriesQuery();

  // The selected repository lives in the URL, so it survives reloads.
  const selectedId = Number(searchParams.get("repository")) || null;
  function select(id: number | null) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (id === null) next.delete("repository");
        else next.set("repository", String(id));
        return next;
      },
      { replace: true },
    );
  }

  const repositories = useMemo(() => {
    const term = filter.trim().toLowerCase();
    const all = repositoriesQuery.data ?? [];
    return term ? all.filter((r) => r.url.toLowerCase().includes(term)) : all;
  }, [repositoriesQuery.data, filter]);

  return (
    <section className="flex min-h-0 flex-col gap-4">
      <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="space-y-2" aria-label="Repository list">
          <FormInput
            id="repositories-filter"
            label="Filter"
            placeholder="owner/name or host"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
          {repositoriesQuery.isError ? (
            <p className="text-sm text-(--color-red)">
              {getQueryErrorMessage(
                repositoriesQuery.error,
                "Failed to load repositories.",
              )}
            </p>
          ) : null}
          <div className="overflow-auto rounded-xl border-2 border-(--color-secondary-soft) p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Last synced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repositoriesQuery.isPending ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <div className="h-12">
                        <Loader />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
                {!repositoriesQuery.isPending && repositories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center">
                      {filter
                        ? "No repository matches the filter."
                        : "No repositories yet. Collections register them."}
                    </TableCell>
                  </TableRow>
                ) : null}
                {repositories.map((repository) => (
                  <RepositoryRow
                    key={repository.id}
                    repository={repository}
                    selected={repository.id === selectedId}
                    onSelect={() =>
                      select(
                        repository.id === selectedId ? null : repository.id,
                      )
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {selectedId === null ? (
          <p className="self-start rounded-xl border-2 border-dashed border-(--color-secondary-soft) p-6 text-center text-sm text-(--color-secondary-muted)">
            Select a repository to see what was collected for it.
          </p>
        ) : (
          <RepositoryDetail
            key={selectedId}
            id={selectedId}
            onDeleted={() => select(null)}
          />
        )}
      </div>
    </section>
  );
}

function RepositoryRow({
  repository,
  selected,
  onSelect,
}: {
  repository: Repository;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TableRow
      aria-selected={selected}
      className={selected ? "bg-(--color-secondary-subtle)" : "cursor-pointer"}
      onClick={onSelect}
    >
      <TableCell className="max-w-72 whitespace-normal wrap-break-word">
        <button
          type="button"
          className="text-left font-semibold underline-offset-2 hover:underline"
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
        >
          {repository.path}
        </button>
        <span className="block text-xs text-(--color-secondary-muted)">
          {repository.host}
        </span>
      </TableCell>
      <TableCell>
        <FormatDateItem value={repository.created_at} />
      </TableCell>
      <TableCell>
        {repository.mirror_last_synced_at ? (
          <FormatDateItem value={repository.mirror_last_synced_at} />
        ) : (
          "-"
        )}
      </TableCell>
    </TableRow>
  );
}

function RepositoryDetail({
  id,
  onDeleted,
}: {
  id: number;
  onDeleted: () => void;
}) {
  const dataQuery = useRepositoryDataQuery(id);
  const removeMutation = useRemoveRepositoryDataMutation();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (dataQuery.isPending) {
    return (
      <div className="h-24">
        <Loader />
      </div>
    );
  }
  if (dataQuery.isError) {
    return (
      <p className="text-sm text-(--color-red)">
        {getQueryErrorMessage(
          dataQuery.error,
          "Failed to load the repository's data.",
        )}
      </p>
    );
  }

  const { repository, parts } = dataQuery.data;

  async function handleRemove(part: RepositoryDataPart) {
    const kept =
      part.shared_count > 0
        ? ` ${formatCount(part.shared_count)} that other repositories also contain will be kept for them.`
        : "";
    const confirmed = window.confirm(
      `Remove ${PLATFORM_LABELS[part.platform] ?? part.platform} "${part.label}" (${formatCount(part.item_count)}) ` +
        `from ${repository.path}?${kept} This can't be undone; collect again to restore it.`,
    );
    if (!confirmed) return;
    try {
      await removeMutation.mutateAsync({
        id,
        platform: part.platform,
        key: part.key,
      });
      toast.success(undefined, {
        description: `Removed "${part.label}" from ${repository.path}.`,
      });
    } catch (error) {
      toast.error(undefined, {
        description: getQueryErrorMessage(
          error,
          `Couldn't remove "${part.label}".`,
        ),
      });
    }
  }

  return (
    <section
      className="space-y-3 self-start"
      aria-label={`Data of ${repository.path}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border-2 border-(--color-secondary-soft) p-4">
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-bold wrap-break-word">
            {repository.path}
          </h2>
          <a
            href={repository.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-(--color-secondary-muted) hover:underline"
          >
            {repository.url}
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
          <p className="text-xs text-(--color-secondary-muted)">
            #{repository.id} · hosted on{" "}
            {repository.remotes.length > 0
              ? repository.remotes
                  .map((r) => PLATFORM_LABELS[r.platform] ?? r.platform)
                  .join(", ")
              : "no known forge"}
          </p>
        </div>
        <Button
          fullWidth={false}
          text="Delete repository"
          icon={<Trash2 />}
          disabled={removeMutation.isPending}
          onClick={() => setIsDeleteOpen(true)}
        />
      </div>

      <div className="overflow-auto rounded-xl border-2 border-(--color-secondary-soft) p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead>Last collected</TableHead>
              <TableHead className="text-right">Remove</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parts.map((part) => (
              <TableRow key={`${part.platform}/${part.key}`}>
                <TableCell className="max-w-96 whitespace-normal">
                  <span className="font-semibold">{part.label}</span>{" "}
                  <span className="text-xs text-(--color-secondary-muted)">
                    {PLATFORM_LABELS[part.platform] ?? part.platform}
                  </span>
                  <span className="block text-xs text-(--color-secondary-muted)">
                    {part.description}
                  </span>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatCount(part.item_count)}
                  {part.shared_count > 0 ? (
                    <span
                      className="block text-xs text-(--color-secondary-muted)"
                      title="Also contained by other repositories (forks); removing keeps them for those"
                    >
                      {formatCount(part.shared_count)} shared
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>
                  {part.last_mined_at ? (
                    <FormatDateItem value={part.last_mined_at} />
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    fullWidth={false}
                    className="w-9 min-h-8.5 px-0 py-0"
                    icon={<Trash2 />}
                    aria-label={`Remove ${part.label} from ${repository.path}`}
                    title={part.item_count > 0 ? "Remove" : "Nothing collected"}
                    disabled={part.item_count === 0 || removeMutation.isPending}
                    onClick={() => void handleRemove(part)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-(--color-secondary-muted)">
        GitHub user profiles aren't tied to one repository, so they aren't
        listed here. Data can't be removed while a collection of the repository
        is running.
      </p>

      <DeleteRepositoryModal
        open={isDeleteOpen}
        data={dataQuery.data}
        onClose={() => setIsDeleteOpen(false)}
        onDeleted={onDeleted}
      />
    </section>
  );
}

// Deleting a repository can't be undone, so the admin types its path to
// confirm, as with other destructive actions on shared data.
function DeleteRepositoryModal({
  open,
  data,
  onClose,
  onDeleted,
}: {
  open: boolean;
  data: RepositoryData;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const deleteMutation = useDeleteRepositoryMutation();
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { repository, parts } = data;
  const collected = parts.filter((p) => p.item_count > 0);

  function close() {
    setTyped("");
    deleteMutation.reset();
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (typed !== repository.path) return;
    try {
      await deleteMutation.mutateAsync(repository.id);
      toast.success(undefined, {
        description: `Deleted ${repository.path} and its data.`,
      });
      close();
      onDeleted();
    } catch {
      // Shown from the mutation state.
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={close}
      title="Delete repository"
      subtitle={repository.url}
      initialFocusRef={inputRef}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <WarningBox
          variant="error"
          text={
            collected.length > 0
              ? `This deletes the repository and everything collected for it: ${collected
                  .map((p) => `${p.label} (${formatCount(p.item_count)})`)
                  .join(
                    ", ",
                  )}. Commits that other repositories also contain are kept for them. It can't be undone.`
              : "Nothing was collected for this repository yet. Deleting it removes its registration. It can't be undone."
          }
        />
        <FormInput
          ref={inputRef}
          id="delete-repository-confirm"
          label={`Type ${repository.path} to confirm`}
          autoComplete="off"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
        />
        {deleteMutation.isError ? (
          <p role="alert" className="text-sm text-(--color-red)">
            {getQueryErrorMessage(
              deleteMutation.error,
              "Couldn't delete the repository.",
            )}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button fullWidth={false} text="Cancel" onClick={close} />
          <Button
            type="submit"
            fullWidth={false}
            text={deleteMutation.isPending ? "Deleting…" : "Delete repository"}
            icon={<Trash2 />}
            disabled={typed !== repository.path || deleteMutation.isPending}
          />
        </div>
      </form>
    </ModalShell>
  );
}
