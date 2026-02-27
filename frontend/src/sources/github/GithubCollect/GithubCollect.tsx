import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleAlert, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/button";
import { FormDateSelector } from "@/components/form";
import { RemovableTag } from "@/components/removable-tag";
import { SelectionButton } from "@/components/selection-button";
import { toast } from "@/components/toast";
import { getQueryErrorMessage } from "@/data";
import { useGithubCollectMutation } from "@/data/modules/github/githubMutations";
import type {
  GithubCollectBody,
  GithubCollectType,
} from "@/data/modules/github/githubService";
import GithubCollectModal from "./GithubCollectModal";

type OptionalCollectType = Exclude<GithubCollectType, "metadata">;

type OptionalCollectOption = {
  collectType: OptionalCollectType;
  label: string;
};

// Lista de tipos opcionais que o usuário pode escolher.
// `collectType` é usado tanto na UI quanto no payload da API.
const OPTIONAL_COLLECT_OPTIONS: ReadonlyArray<OptionalCollectOption> = [
  { collectType: "issues", label: "Issues" },
  { collectType: "comments", label: "Comments" },
  { collectType: "pull_requests", label: "Pull requests" },
  { collectType: "commits", label: "Commits" },
];

// Formata a data para o formato ISO exigido pela API do GitHub.
function formatDateGitHub(dateStr: string) {
  if (!dateStr) return undefined;

  const date = new Date(dateStr);
  date.setHours(13, 42, 0, 888);

  return date.toISOString();
}

// Adiciona ou remove um item de uma lista, retornando a nova lista.
// Utilizado para gerenciar a seleção de tipos de coleta opcionais.
function toggleArrayItem<T extends string>(list: T[], item: T): T[] {
  const itemJaExiste = list.includes(item);

  if (itemJaExiste) {
    return list.filter((currentItem) => currentItem !== item);
  }

  return [...list, item];
}

export default function GithubCollect() {
  // Navegação para redirecionar para jobs após coleta
  const navigate = useNavigate();

  // Mutation para iniciar a coleta, gerenciada por React Query.
  const collectMutation = useGithubCollectMutation();

  // Estado para armazenar os repositórios adicionados pelo usuário.
  const [repositories, setRepositories] = useState<string[]>([]);

  // Estados para armazenar as datas de início e fim.
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Estado para armazenar os tipos de coleta opcionais selecionados.
  const [selectedOptionalTypes, setSelectedOptionalTypes] = useState<
    OptionalCollectType[]
  >([]);

  // Estado para controlar a abertura do modal de adição de repositórios.
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Verifica se todos os tipos opcionais estão selecionados para atualizar o estado do botão "Select all".
  const allOptionalTypesSelected = OPTIONAL_COLLECT_OPTIONS.every(
    ({ collectType }) => selectedOptionalTypes.includes(collectType),
  );
  // Conta o número total de tipos de coleta selecionados, incluindo o tipo obrigatório "metadata".
  const selectedCollectTypesCount = 1 + selectedOptionalTypes.length;

  // Função para adicionar um repositório à lista.
  function handleAddRepository(normalizedRepository: string) {
    setRepositories((currentRepositories) => [
      ...currentRepositories,
      normalizedRepository,
    ]);
  }

  // Função para remover um repositório da lista.
  function handleRemoveRepository(repositoryToRemove: string) {
    setRepositories((currentRepositories) =>
      currentRepositories.filter(
        (repository) => repository !== repositoryToRemove,
      ),
    );
  }

  // Função para alternar a seleção de um tipo de coleta opcional.
  function handleToggleCollectType(option: OptionalCollectType) {
    setSelectedOptionalTypes((currentTypes) => {
      const nextTypes = toggleArrayItem(currentTypes, option);
      return nextTypes;
    });
  }

  // Função para iniciar a coleta, enviando os dados para a API e lidando com o sucesso ou erro da operação.
  async function handleCollect() {
    const payload: GithubCollectBody = {
      repositories,
      depth: "basic",
      collect_types: ["metadata", ...selectedOptionalTypes],
      ...(startDate ? { start_date: formatDateGitHub(startDate) } : {}),
      ...(endDate ? { end_date: formatDateGitHub(endDate) } : {}),
    };

    try {
      // Inicia a coleta com o payload formatado, utilizando a mutation definida (Tanstack React Query).
      await collectMutation.mutateAsync(payload);

      // Exibe uma notificação de sucesso e redireciona para a página de jobs.
      toast.success(undefined, {
        description: "GitHub collection started successfully.",
      });
      navigate("/jobs");
    } catch (error) {
      // Em caso de erro, extrai a mensagem de erro e exibe uma notificação de falha.
      const message = getQueryErrorMessage(
        error,
        "Failed to start GitHub collection.",
      );
      // Exibe a mensagem de erro usando o componente de toast.
      toast.error(undefined, { description: message });
    }
  }

  return (
    <>
      <section className="w-full xl:flex xl:min-h-[70vh] xl:items-center">
        <section className="w-full xl:w-[70%] xl:min-w-180 xl:max-w-full space-y-4 rounded-xl border-2 border-(--color-secondary-soft) bg-(--color-primary) p-4 xl:mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-(--color-secondary)">
                GitHub Collect
              </h2>
              <p className="text-sm text-(--color-secondary-muted)">
                Configure repositories, optional date range and collection
                types.
              </p>
            </div>

            <Button
              size="sm"
              fullWidth={false}
              text="Add repository"
              icon={<Plus />}
              onClick={() => setIsAddModalOpen(true)}
            />
          </div>

          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-(--color-secondary)">
                Repositories ({repositories.length})
              </h3>
            </div>

            <div className="min-h-28 rounded-lg border border-(--color-secondary-soft) bg-(--color-primary) p-3">
              {repositories.length === 0 ? (
                <div className="grid min-h-24 place-items-center rounded-md border border-dashed border-(--color-secondary-subtle) text-center text-sm text-(--color-secondary-muted)">
                  No repositories added yet. Click the "Add repository" button
                  above to get started.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {repositories.map((repository) => (
                    <RemovableTag
                      key={repository}
                      label={repository}
                      onRemove={() => handleRemoveRepository(repository)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-3">
            {!startDate && !endDate ? (
              <div
                className="flex items-start gap-2 rounded-lg border bg-transparent p-3 text-sm"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-amber) 12%, var(--color-primary))",
                  borderColor:
                    "color-mix(in srgb, var(--color-amber) 42%, var(--color-secondary-soft))",
                  color: "var(--color-amber)",
                }}
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <p>
                  Leaving both date fields empty will mine data from the entire
                  period.
                </p>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <FormDateSelector
                id="github-collect-start-date"
                label="Start"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                max={endDate || undefined}
                wrapperClassName="min-w-0"
              />

              <FormDateSelector
                id="github-collect-end-date"
                label="Finish"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                min={startDate || undefined}
                wrapperClassName="min-w-0"
              />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-(--color-secondary)">
                  Collection Scope
                </h3>
                <p className="text-xs text-(--color-secondary-muted)">
                  Choose which GitHub data types this job should collect.
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-(--color-secondary-soft) p-3">
              <div className="flex flex-wrap items-center gap-2">
                <SelectionButton
                  size="sm"
                  fullWidth={false}
                  pressed={allOptionalTypesSelected}
                  text={
                    allOptionalTypesSelected ? "Clear extras" : "Select all"
                  }
                  onPressedChange={(nextPressed) =>
                    setSelectedOptionalTypes(
                      nextPressed
                        ? OPTIONAL_COLLECT_OPTIONS.map(
                            ({ collectType }) => collectType,
                          )
                        : [],
                    )
                  }
                />

                <span className="ml-auto inline-flex min-h-9 items-center rounded-md border border-(--color-secondary-soft) px-2.5 py-1 text-xs font-medium text-(--color-secondary-muted)">
                  {selectedCollectTypesCount} selected
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="pointer-events-none sm:col-span-2">
                  <SelectionButton
                    size="sm"
                    fullWidth
                    pressed
                    text="Metadata (always included)"
                  />
                </div>

                {OPTIONAL_COLLECT_OPTIONS.map(({ collectType, label }) => (
                  <SelectionButton
                    key={collectType}
                    size="sm"
                    pressed={selectedOptionalTypes.includes(collectType)}
                    text={label}
                    onPressedChange={() => handleToggleCollectType(collectType)}
                  />
                ))}
              </div>
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button
              fullWidth={false}
              text={collectMutation.isPending ? "Collecting..." : "Collect"}
              onClick={() => void handleCollect()}
              disabled={collectMutation.isPending || repositories.length === 0}
              icon={
                collectMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : undefined
              }
              aria-label={
                collectMutation.isPending
                  ? "Starting GitHub collection"
                  : "Start GitHub collection"
              }
              className="min-w-40 px-4"
            />
          </div>
        </section>
      </section>

      <GithubCollectModal
        open={isAddModalOpen}
        repositories={repositories}
        onClose={() => setIsAddModalOpen(false)}
        onAddRepository={handleAddRepository}
      />
    </>
  );
}
