import type { PlatformId } from "../../api/endpoints";

// `GET /api/platforms`: what each platform supports and which credentials it takes.
export type CredentialField = {
  name: string;
  label: string;
  // Secret fields are encrypted and never returned; only a hint is.
  secret: boolean;
  optional?: boolean;
};

export type CredentialKind = {
  name: string;
  description: string;
  fields: CredentialField[];
};

export type PlatformInfo = {
  id: PlatformId;
  credential_kinds: CredentialKind[];
  can_collect: boolean;
  has_dashboard: boolean;
  datasets: string[];
};

export type CredentialQuota = {
  scope: string;
  request_limit: number;
  requests_remaining: number;
  resets_at: string;
};

export type CredentialTestResult = {
  ok: boolean;
  reason?: string;
  // e.g. the GitHub login the token belongs to.
  identity?: string;
  quotas?: CredentialQuota[];
};

// A credential as the API exposes it: never the secret itself.
export type Credential = {
  id: number;
  platform: PlatformId;
  kind: string;
  label: string;
  public: Record<string, string>;
  // Last characters of each secret field.
  secret_hints: Record<string, string>;
  status: "active" | "invalid" | "disabled";
  last_tested_at?: string;
  last_test_result?: CredentialTestResult;
  created_at: string;
};

export type AddCredentialBody = {
  platform: PlatformId;
  kind: string;
  label: string;
  fields: Record<string, string>;
};
