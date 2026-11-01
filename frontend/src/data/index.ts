// Re-exports hooks and mutations for direct usage via "@/data".
export * from "./modules/auth/authQueries";
export * from "./modules/collections/collectionQueries";
export * from "./modules/credentials/credentialQueries";
export * from "./modules/dashboard/dashboardQueries";
export * from "./modules/datasets/datasetQueries";
export * from "./modules/repositories/repositoryQueries";
export { buildDatasetExportUrl } from "./modules/datasets/datasetService";

// Re-exports module types from the same shared entry point.
export type {
  Dashboard,
  DashboardCard,
  DashboardDateRange,
  DashboardEntity,
  DashboardFilter,
  DashboardGraph,
  DashboardGraphFilter,
  DashboardGraphInterval,
  DashboardGraphs,
  DateBounds,
  HookQueryOptions,
} from "./modules/shared";
export { mergeDateRanges, toApiSince, toApiUntil } from "./modules/shared";
export type {
  ChangePasswordBody,
  CreateUserBody,
  LoginBody,
  User,
  UserRole,
} from "./modules/auth";
export { MIN_PASSWORD_LENGTH, hasRole, userRoles } from "./modules/auth";
export type {
  Collection,
  CollectionJobError,
  CollectionStatus,
  GitCollectionParameters,
  GithubResource,
  Repository,
  StartCollectionBody,
} from "./modules/collections/collectionTypes";
export type {
  AddCredentialBody,
  Credential,
  CredentialField,
  CredentialKind,
  CredentialQuota,
  CredentialTestResult,
  PlatformInfo,
} from "./modules/credentials/credentialTypes";
export type {
  DatasetColumn,
  DatasetExportFormat,
  DatasetFilters,
  DatasetInfo,
  DatasetPage,
  DatasetPreviewParams,
  DatasetRow,
} from "./modules/datasets/datasetTypes";
export type {
  RepositoryData,
  RepositoryDataPart,
  RepositoryRemote,
} from "./modules/repositories/repositoryTypes";
export type { PlatformId } from "./api/endpoints";
export { endpoints } from "./api/endpoints";
export { apiUrl, setUnauthorizedHandler } from "./api/apiClient";

// Error helper used by components/screens.
export { getQueryErrorMessage } from "./query/errors";
export { queryClient } from "./query/client";
