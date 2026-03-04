import { useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/button";
import { FormInput } from "@/components/form";
import { SelectionButton } from "@/components/selection-button";
import type { StackOverflowAdvancedCollectFilters } from "@/data/modules/stackoverflow/stackoverflowService";

type StackoverflowAdvancedFiltersFormState = {
  min: string;
  max: string;
  answers: string;
  views: string;
  intitle: string;
  nottagged: string;
  user: string;
  accepted: boolean;
  closed: boolean;
  migrated: boolean;
};

const INITIAL_ADVANCED_FILTERS_STATE: StackoverflowAdvancedFiltersFormState = {
  min: "",
  max: "",
  answers: "",
  views: "",
  intitle: "",
  nottagged: "",
  user: "",
  accepted: false,
  closed: false,
  migrated: false,
};

type StackoverflowAdvancedFiltersSectionState = {
  enabled: boolean;
  filters: StackOverflowAdvancedCollectFilters | undefined;
};

type StackoverflowAdvancedFiltersSectionProps = {
  onChange: (nextState: StackoverflowAdvancedFiltersSectionState) => void;
};

function parseOptionalNumber(value: string): number | undefined {
  const trimmedValue = value.trim();
  if (!trimmedValue) return undefined;

  const numberValue = Number(trimmedValue);
  if (!Number.isFinite(numberValue)) return undefined;

  return numberValue;
}

// converte o estado local da ui para o payload do endpoint advanced.
function buildAdvancedFiltersPayload(
  filters: StackoverflowAdvancedFiltersFormState,
): StackOverflowAdvancedCollectFilters | undefined {
  const payload: StackOverflowAdvancedCollectFilters = {};

  const min = parseOptionalNumber(filters.min);
  const max = parseOptionalNumber(filters.max);
  const answers = parseOptionalNumber(filters.answers);
  const views = parseOptionalNumber(filters.views);

  if (min !== undefined) payload.min = min;
  if (max !== undefined) payload.max = max;
  if (answers !== undefined) payload.answers = answers;
  if (views !== undefined) payload.views = views;

  const intitle = filters.intitle.trim();
  const nottagged = filters.nottagged.trim();
  const user = filters.user.trim();

  if (intitle) payload.intitle = intitle;
  if (nottagged) payload.nottagged = nottagged;
  if (user) payload.user = user;

  if (filters.accepted) payload.accepted = true;
  if (filters.closed) payload.closed = true;
  if (filters.migrated) payload.migrated = true;

  return Object.keys(payload).length > 0 ? payload : undefined;
}

export function StackoverflowAdvancedFiltersSection({
  onChange,
}: StackoverflowAdvancedFiltersSectionProps) {
  // controla se o modo advanced está ativo.
  const [advancedFiltersEnabled, setAdvancedFiltersEnabled] = useState(false);
  // guarda os campos do formulário advanced.
  const [advancedFilters, setAdvancedFilters] =
    useState<StackoverflowAdvancedFiltersFormState>(
      INITIAL_ADVANCED_FILTERS_STATE,
    );

  // notifica a tela pai com o estado atual normalizado.
  function emitChange(
    nextEnabled: boolean,
    nextFilters: StackoverflowAdvancedFiltersFormState,
  ) {
    onChange({
      enabled: nextEnabled,
      filters: nextEnabled ? buildAdvancedFiltersPayload(nextFilters) : undefined,
    });
  }

  // atualiza um ou mais campos mantendo o restante.
  function updateFilters(patch: Partial<StackoverflowAdvancedFiltersFormState>) {
    setAdvancedFilters((currentFilters) => {
      const nextFilters = { ...currentFilters, ...patch };
      emitChange(advancedFiltersEnabled, nextFilters);
      return nextFilters;
    });
  }

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-(--color-secondary)">
          Advanced Filters
        </h3>
        <p className="text-xs text-(--color-secondary-muted)">
          Enable optional Stack Overflow filters. Leave fields empty to ignore
          them.
        </p>
      </div>

      <Button
        size="sm"
        fullWidth={false}
        variant="selectable"
        selected={advancedFiltersEnabled}
        text="Advanced filters"
        icon={advancedFiltersEnabled ? <Check /> : undefined}
        onClick={() => {
          const nextEnabled = !advancedFiltersEnabled;
          setAdvancedFiltersEnabled(nextEnabled);
          emitChange(nextEnabled, advancedFilters);
        }}
      />

      {advancedFiltersEnabled ? (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <FormInput
              id="stackoverflow-collect-intitle"
              label="Title contains"
              value={advancedFilters.intitle}
              onChange={(event) => updateFilters({ intitle: event.target.value })}
            />

            <FormInput
              id="stackoverflow-collect-nottagged"
              label="Exclude tags"
              value={advancedFilters.nottagged}
              onChange={(event) =>
                updateFilters({ nottagged: event.target.value })
              }
            />

            <FormInput
              id="stackoverflow-collect-user"
              label="User ID"
              value={advancedFilters.user}
              onChange={(event) => updateFilters({ user: event.target.value })}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <FormInput
              id="stackoverflow-collect-min"
              label="Min score"
              type="number"
              value={advancedFilters.min}
              onChange={(event) => updateFilters({ min: event.target.value })}
            />

            <FormInput
              id="stackoverflow-collect-max"
              label="Max score"
              type="number"
              value={advancedFilters.max}
              onChange={(event) => updateFilters({ max: event.target.value })}
            />

            <FormInput
              id="stackoverflow-collect-answers"
              label="Min answers"
              type="number"
              value={advancedFilters.answers}
              onChange={(event) => updateFilters({ answers: event.target.value })}
            />

            <FormInput
              id="stackoverflow-collect-views"
              label="Min views"
              type="number"
              value={advancedFilters.views}
              onChange={(event) => updateFilters({ views: event.target.value })}
            />
          </div>

          <div className="mt-8 grid gap-2 md:grid-cols-3">
            <SelectionButton
              size="sm"
              fullWidth
              pressed={advancedFilters.accepted}
              text="Accepted only"
              onPressedChange={(nextPressed) =>
                updateFilters({ accepted: nextPressed })
              }
            />

            <SelectionButton
              size="sm"
              fullWidth
              pressed={advancedFilters.closed}
              text="Closed only"
              onPressedChange={(nextPressed) =>
                updateFilters({ closed: nextPressed })
              }
            />

            <SelectionButton
              size="sm"
              fullWidth
              pressed={advancedFilters.migrated}
              text="Migrated only"
              onPressedChange={(nextPressed) =>
                updateFilters({ migrated: nextPressed })
              }
            />
          </div>
        </>
      ) : null}
    </section>
  );
}

export type {
  StackoverflowAdvancedFiltersSectionProps,
  StackoverflowAdvancedFiltersSectionState,
};
