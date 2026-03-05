import {
  defaultSectionPreviewIdBySource,
  defaultSourceId,
  sectionPreviewIdsBySource,
  sourceIds,
  type SectionPreviewIdBySource,
  type SourceId,
} from "@/sources";

// returns the SourceId correspondente to rawSource, ou the defaultSourceId se rawSource for invalid ou ausente.
export function resolveSourceId(
  rawSource: string | null | undefined,
): SourceId {
  if (rawSource && sourceIds.includes(rawSource as SourceId)) {
    return rawSource as SourceId;
  }

  return defaultSourceId;
}

// returns the SectionId correspondente to rawSection for the source dada, ou the defaultSectionId for essa source se rawSection for invalid ou ausente.
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
