import {
  defaultSectionPreviewIdBySource,
  defaultSourceId,
  sectionPreviewIdsBySource,
  sourceIds,
  type SectionPreviewIdBySource,
  type SourceId,
} from "@/sources";

// Returns SourceId matching rawSource, or defaultSourceId if invalid/missing.
export function resolveSourceId(
  rawSource: string | null | undefined,
): SourceId {
  if (rawSource && sourceIds.includes(rawSource as SourceId)) {
    return rawSource as SourceId;
  }

  return defaultSourceId;
}

// Returns SectionId matching rawSection for the given source, or that source's default section if invalid/missing.
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
