import {
  defaultSectionPreviewIdBySource,
  defaultSourceId,
  sectionPreviewIdsBySource,
  sourceIds,
  type SectionPreviewIdBySource,
  type SourceId,
} from "@/sources";

// Retorna o SourceId correspondente ao rawSource, ou o defaultSourceId se rawSource for inválido ou ausente.
export function resolveSourceId(
  rawSource: string | null | undefined,
): SourceId {
  if (rawSource && sourceIds.includes(rawSource as SourceId)) {
    return rawSource as SourceId;
  }

  return defaultSourceId;
}

// Retorna o SectionId correspondente ao rawSection para a source dada, ou o defaultSectionId para essa source se rawSection for inválido ou ausente.
export function resolveSectionId<S extends SourceId>(
  source: S,
  rawSection: string | null | undefined,
): SectionPreviewIdBySource[S] {
  const sectionIds = sectionPreviewIdsBySource[source] as readonly string[];

  if (rawSection && sectionIds.includes(rawSection)) {
    return rawSection as SectionPreviewIdBySource[S];
  }

  return defaultSectionPreviewIdBySource[source];
}
