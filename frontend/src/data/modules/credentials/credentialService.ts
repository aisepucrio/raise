import { api } from "../../api/apiClient";
import { endpoints } from "../../api/endpoints";
import type { RequestOptions } from "../shared";
import type {
  AddCredentialBody,
  Credential,
  PlatformInfo,
} from "./credentialTypes";

export const credentialService = {
  listPlatforms: (options?: RequestOptions) =>
    api.get<PlatformInfo[], PlatformInfo[]>(endpoints.platforms(), {
      signal: options?.signal,
    }),

  // Researcher or admin.
  list: (options?: RequestOptions) =>
    api.get<Credential[], Credential[]>(endpoints.credentials(), {
      signal: options?.signal,
    }),

  // Admin only. The API tests the credential before answering, so the
  // response already has its status.
  add: (body: AddCredentialBody) =>
    api.post<Credential, Credential>(endpoints.credentials(), body),

  // Admin only.
  test: (id: number) =>
    api.post<Credential, Credential>(endpoints.testCredential(id)),

  // Admin only.
  remove: (id: number) => api.delete(endpoints.credential(id)),
};
