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
import { getQueryErrorMessage } from "@/data";
import {
  useRestartCollectionMutation,
  useStopJobMutation,
} from "@/data/modules/jobs/jobsMutations";
import { useJobsListQuery } from "@/data/modules/jobs/jobsQueries";

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

  // Paginação e ordenação são estado puramente visual; ficam nesta página e não vazam para o data layer.
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
    // Auto-reload da listagem a cada 5s (independente do botão manual).
    const intervalId = window.setInterval(() => {
      // Mantém feedback visual consistente: auto-reload também anima o ícone.
      setReloadIconAnimationKey((value) => value + 1);
      void jobsQuery.refetch();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [jobsQuery.refetch]);

  // O erro de ação pode vir de qualquer uma das mutations, então lê ambos e prioriza a exibição.
  const actionError = stopJobMutation.isError
    ? stopJobMutation.error
    : restartCollectionMutation.isError
      ? restartCollectionMutation.error
      : null;
  const actionErrorMessage = actionError
    ? getQueryErrorMessage(actionError, "Failed to run job action.")
    : null;

  // Enquanto uma ação de linha (stop/restart) está pendente, desabilita os botões dessa linha para evitar ações concorrentes.
  const isRowActionPending =
    stopJobMutation.isPending ||
    restartCollectionMutation.isPending ||
    isActionSyncPending;

  // Efeito para disparar toast de erro quando uma ação falha.
  useEffect(() => {
    if (!actionErrorMessage) return;

    toast.error(undefined, {
      description: actionErrorMessage,
    });
  }, [actionErrorMessage]);

  // Efeito para disparar toast de erro quando a ação de parar tarefa é bem-sucedida.
  useEffect(() => {
    if (!stopJobMutation.isSuccess) return;

    toast.success(undefined, {
      description: "Task stopped successfully.",
    });
  }, [stopJobMutation.isSuccess]);

  // Efeito para disparar toast de erro quando a ação de restartar tarefa é bem-sucedida.
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

  // Função utilitária para rodar uma ação de job (stop/restart) com lock para evitar concorrência e refetch da listagem ao final.
  async function runJobAction(action: () => Promise<unknown>) {
    if (actionLockRef.current) return;

    setActionLock(true);

    try {
      await action();
      await jobsQuery.refetch();
    } catch {
      // O toast de erro usa o estado da mutation; evita erro não tratado no handler.
    } finally {
      setActionLock(false);
    }
  }

  // Chama mutation de stop (e trava ações concorrentes até completar com runJobAction).
  function handleStopJob(taskId: string) {
    stopJobMutation.reset();
    restartCollectionMutation.reset();
    void runJobAction(() => stopJobMutation.mutateAsync(taskId));
  }

  // Chama mutation de restart (e trava ações concorrentes até completar com runJobAction).
  function handleRestartJob(taskId: string) {
    stopJobMutation.reset();
    restartCollectionMutation.reset();
    void runJobAction(() => restartCollectionMutation.mutateAsync(taskId));
  }

  // Handler de clique do botão de recarga: dispara refetch e anima o ícone.
  function handleReloadClick() {
    // Cada clique remonta o ícone para rodar a animação uma única vez.
    setReloadIconAnimationKey((value) => value + 1);
    void jobsQuery.refetch();
  }

  return (
    <section>
      {/* Cabeçalho principal da tela: contexto rápido do que esta página exibe. */}
      <PageHeader
        title="Jobs"
        subtitle="Monitor collection jobs, inspect raw records, and run simple retry/stop actions."
      />

      {/* Ações globais da tela: ordenação visual e recarga da consulta. */}
      <div className="mb-4 flex flex-wrap justify-end gap-2">
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

      {/* Card/bloco principal que agrupa feedbacks, tabela e controles de paginação. */}
      <section className="space-y-4 rounded-xl border-2 border-(--color-sidebar-border) p-4">
        {/* Erro da listagem: falha ao buscar jobs (query principal da página). */}
        {jobsQuery.isError ? (
          <p className="text-sm text-(--color-form-error)">
            {getQueryErrorMessage(jobsQuery.error, "Failed to load jobs.")}
          </p>
        ) : null}

        {/* Tabela de jobs (campos crus da API, com data/status formatados por componentes dedicados). */}
        <Table>
          {/* Cabeçalho das colunas visíveis na listagem. */}
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
            {/* Estado de carregamento inicial da query: ocupa a linha inteira da tabela. */}
            {jobsQuery.isPending ? (
              <TableRow>
                <TableCell colSpan={5} className="py-2">
                  <div className="h-16">
                    <Loader />
                  </div>
                </TableCell>
              </TableRow>
            ) : null}

            {/* Estado vazio: query concluída sem registros para exibir. */}
            {!jobsQuery.isPending && paginatedJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center">
                  No jobs found.
                </TableCell>
              </TableRow>
            ) : null}

            {/* Linhas de dados paginadas: renderiza apenas o recorte da página atual. */}
            {!jobsQuery.isPending &&
              paginatedJobs.map((job) => {
                // O componente de status centraliza cor/label e também expõe as ações válidas.
                const statusInfo = getFormatStatusItemInfo(job.status);
                const canStop = statusInfo.actions.stopActionActive;
                const canRestart = statusInfo.actions.restartActionActive;

                return (
                  <TableRow key={job.task_id}>
                    {/* Project */}
                    <TableCell className="font-medium">
                      {job.repository ?? ""}
                    </TableCell>
                    {/* Description (quebra linha se muito grande) */}
                    <TableCell className="max-w-160 whitespace-normal wrap-break-word">
                      {job.operation ?? ""}
                    </TableCell>
                    {/* Data */}
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
                      {/* Ações da linha: só aparecem quando o status permite. */}
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

        {/* Rodapé reutilizável de paginação da tabela. */}
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
      </section>
    </section>
  );
}
