import { useEffect, useMemo, useState, type FormEvent } from "react";
import { KeyRound, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/button";
import { FormatDateItem } from "@/components/format-date-item";
import { FormInput, FormSelect } from "@/components/form";
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
import { toast } from "@/components/toast";
import {
  getQueryErrorMessage,
  hasRole,
  useAddCredentialMutation,
  useCredentialsQuery,
  useDeleteCredentialMutation,
  useMeQuery,
  usePlatformsQuery,
  useTestCredentialMutation,
  type Credential,
  type PlatformId,
  type PlatformInfo,
} from "@/data";

const PLATFORM_LABELS: Record<string, string> = {
  git: "Git",
  github: "GitHub",
  gitlab: "GitLab",
  jira: "Jira",
  stackoverflow: "Stack Overflow",
};

const STATUS_COLORS: Record<Credential["status"], string> = {
  active: "--color-teal",
  invalid: "--color-rose",
  disabled: "--color-slate",
};

// Whether the platform is mined today: it starts collections (git) or serves
// mined data (github, an enrichment of git collections).
function isMined(platform: PlatformInfo) {
  return platform.can_collect || platform.has_dashboard;
}

// Public fields as they are, secret fields as their last characters.
function describeFields(credential: Credential) {
  return [
    ...Object.entries(credential.public ?? {}).map(([name, value]) => `${name}: ${value}`),
    ...Object.entries(credential.secret_hints ?? {}).map(([name, hint]) => `${name}: …${hint}`),
  ].join(", ");
}

// The most constrained quota from the last test, e.g. "4,980 / 5,000 (graphql)".
function describeQuota(credential: Credential) {
  const quotas = credential.last_test_result?.quotas ?? [];
  if (quotas.length === 0) return "-";
  const lowest = quotas.reduce((a, b) =>
    a.requests_remaining / a.request_limit <= b.requests_remaining / b.request_limit ? a : b,
  );
  const format = new Intl.NumberFormat("en-US");
  return `${format.format(lowest.requests_remaining)} / ${format.format(lowest.request_limit)} (${lowest.scope})`;
}

// The lab-wide pool of platform tokens that mining jobs lease from
// (backend-go architecture.md §7). Researchers see it; admins manage it.
// Secrets are sent once, encrypted by the API, and never returned.
export default function CredentialsPage() {
  const { data: currentUser } = useMeQuery();
  const isAdmin = hasRole(currentUser?.role, "admin");

  const platformsQuery = usePlatformsQuery();
  const credentialsQuery = useCredentialsQuery();
  const addMutation = useAddCredentialMutation();
  const testMutation = useTestCredentialMutation();
  const deleteMutation = useDeleteCredentialMutation();

  // Platforms that take credentials. Those that can't collect yet are listed
  // too, so their tokens can be stored ahead of time.
  const platforms = useMemo(
    () => (platformsQuery.data ?? []).filter((p) => p.credential_kinds.length > 0),
    [platformsQuery.data],
  );

  const [platformId, setPlatformId] = useState<PlatformId | "">("");
  const [kindName, setKindName] = useState("");
  const [label, setLabel] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  // Defaults to the first platform (GitHub) once the catalogue loads.
  useEffect(() => {
    if (!platformId && platforms.length > 0) setPlatformId(platforms[0].id);
  }, [platformId, platforms]);

  const platform = platforms.find((p) => p.id === platformId);
  const kind =
    platform?.credential_kinds.find((k) => k.name === kindName) ??
    platform?.credential_kinds[0];

  const missingField = kind?.fields.find((f) => !f.optional && !fields[f.name]?.trim());
  const canSubmit = Boolean(platform && kind && label.trim() && !missingField);

  function resetForm() {
    setLabel("");
    setFields({});
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!platform || !kind || !canSubmit) return;
    const filled = Object.fromEntries(
      Object.entries(fields)
        .map(([name, value]) => [name, value.trim()])
        .filter(([, value]) => value),
    );
    try {
      const credential = await addMutation.mutateAsync({
        platform: platform.id,
        kind: kind.name,
        label: label.trim(),
        fields: filled,
      });
      resetForm();
      const result = credential.last_test_result;
      if (credential.status === "active") {
        toast.success(undefined, {
          description: `Added "${credential.label}"${result?.identity ? ` (${result.identity})` : ""}. The test passed.`,
        });
      } else {
        toast.warning(undefined, {
          description: `Added "${credential.label}", but its test failed${result?.reason ? `: ${result.reason}` : "."}`,
        });
      }
    } catch {
      // The error is shown from the mutation state.
    }
  }

  async function handleTest(credential: Credential) {
    try {
      const tested = await testMutation.mutateAsync(credential.id);
      if (tested.status === "active") {
        toast.success(undefined, { description: `"${tested.label}" works.` });
      } else {
        toast.error(undefined, {
          description: `"${tested.label}" failed${tested.last_test_result?.reason ? `: ${tested.last_test_result.reason}` : "."}`,
        });
      }
    } catch (error) {
      toast.error(undefined, {
        description: getQueryErrorMessage(error, "Couldn't test the credential."),
      });
    }
  }

  async function handleDelete(credential: Credential) {
    // Deleting can't be undone: the secret would have to be entered again.
    if (!window.confirm(`Delete the credential "${credential.label}"? This can't be undone.`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(credential.id);
      toast.success(undefined, { description: `Deleted "${credential.label}".` });
    } catch (error) {
      toast.error(undefined, {
        description: getQueryErrorMessage(error, "Couldn't delete the credential."),
      });
    }
  }

  const isRowActionPending = testMutation.isPending || deleteMutation.isPending;
  const credentials = credentialsQuery.data ?? [];

  return (
    <section className="flex h-full min-h-0 flex-col gap-4 overflow-auto">
      <PageHeader
        title="Credentials"
        subtitle="Platform tokens shared by the lab. Mining jobs spread their requests across all active tokens of a platform."
      />

      {isAdmin ? (
        <form
          onSubmit={(event) => void handleAdd(event)}
          className="grid max-w-4xl gap-4 rounded-xl border-2 border-(--color-secondary-soft) p-4 md:grid-cols-2"
          aria-label="Add credential"
        >
          <h2 className="text-sm font-semibold text-(--color-secondary) md:col-span-2">
            Add a credential
          </h2>
          <FormSelect
            id="credential-platform"
            label="Platform"
            value={platformId}
            onChange={(event) => {
              setPlatformId(event.target.value as PlatformId);
              setKindName("");
              setFields({});
            }}
            hint={
              platform && !isMined(platform)
                ? "This platform can't be mined yet; the token is stored for later."
                : undefined
            }
          >
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {PLATFORM_LABELS[p.id] ?? p.id}
                {isMined(p) ? "" : " (not mined yet)"}
              </option>
            ))}
          </FormSelect>
          <FormInput
            id="credential-label"
            label="Label"
            placeholder="e.g. lab token 1"
            autoComplete="off"
            maxLength={100}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            required
          />
          {platform && platform.credential_kinds.length > 1 ? (
            <FormSelect
              id="credential-kind"
              label="Kind"
              value={kind?.name ?? ""}
              onChange={(event) => {
                setKindName(event.target.value);
                setFields({});
              }}
            >
              {platform.credential_kinds.map((k) => (
                <option key={k.name} value={k.name}>
                  {k.name}
                </option>
              ))}
            </FormSelect>
          ) : null}

          {kind?.description ? (
            <p className="text-xs text-(--color-secondary-muted) md:col-span-2">
              {kind.description}
            </p>
          ) : null}

          {kind?.fields.map((field) => (
            <FormInput
              key={`${platform?.id}-${kind.name}-${field.name}`}
              id={`credential-field-${field.name}`}
              label={field.label}
              type={field.secret ? "password" : "text"}
              autoComplete={field.secret ? "new-password" : "off"}
              value={fields[field.name] ?? ""}
              onChange={(event) =>
                setFields((current) => ({ ...current, [field.name]: event.target.value }))
              }
              hint={field.secret ? "Encrypted at rest; never shown again." : undefined}
              required={!field.optional}
            />
          ))}

          {addMutation.isError ? (
            <p role="alert" className="text-sm text-(--color-red) md:col-span-2">
              {getQueryErrorMessage(addMutation.error, "Couldn't add the credential.")}
            </p>
          ) : null}

          <div className="md:col-span-2">
            <Button
              type="submit"
              fullWidth={false}
              text={addMutation.isPending ? "Adding and testing…" : "Add credential"}
              icon={<KeyRound />}
              disabled={addMutation.isPending || !canSubmit}
            />
          </div>
        </form>
      ) : (
        <p className="text-sm text-(--color-secondary-muted)">
          Only admins can add, test or delete credentials.
        </p>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-(--color-secondary)">Credentials</h2>
        {credentialsQuery.isError ? (
          <p className="text-sm text-(--color-red)">
            {getQueryErrorMessage(credentialsQuery.error, "Failed to load credentials.")}
          </p>
        ) : null}
        <div className="overflow-auto rounded-xl border-2 border-(--color-secondary-soft) p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quota left</TableHead>
                <TableHead>Last tested</TableHead>
                {isAdmin ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {credentialsQuery.isPending ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="h-12">
                      <Loader />
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
              {!credentialsQuery.isPending && credentials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center">
                    No credentials yet.{" "}
                    {isAdmin
                      ? "Add a GitHub token above to mine issues, pull requests and more."
                      : "Ask an admin to add one."}
                  </TableCell>
                </TableRow>
              ) : null}
              {credentials.map((credential) => {
                const result = credential.last_test_result;
                const color = `var(${STATUS_COLORS[credential.status] ?? "--color-steel"})`;
                return (
                  <TableRow key={credential.id}>
                    <TableCell>{PLATFORM_LABELS[credential.platform] ?? credential.platform}</TableCell>
                    <TableCell className="font-medium">{credential.label}</TableCell>
                    <TableCell className="max-w-64 whitespace-normal wrap-break-word">
                      {describeFields(credential)}
                    </TableCell>
                    <TableCell className="max-w-64 whitespace-normal">
                      <span className="font-semibold" style={{ color }}>
                        {credential.status}
                      </span>
                      {result?.identity ? (
                        <span className="block text-xs text-(--color-secondary-muted)">
                          as {result.identity}
                        </span>
                      ) : null}
                      {result && !result.ok && result.reason ? (
                        <span className="block text-xs text-(--color-rose)">{result.reason}</span>
                      ) : null}
                    </TableCell>
                    <TableCell>{describeQuota(credential)}</TableCell>
                    <TableCell>
                      {credential.last_tested_at ? (
                        <FormatDateItem value={credential.last_tested_at} />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    {isAdmin ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            fullWidth={false}
                            className="w-9 min-h-8.5 px-0 py-0"
                            icon={<RefreshCw />}
                            aria-label={`Test credential ${credential.label}`}
                            title="Test again"
                            disabled={isRowActionPending}
                            onClick={() => void handleTest(credential)}
                          />
                          <Button
                            fullWidth={false}
                            className="w-9 min-h-8.5 px-0 py-0"
                            icon={<Trash2 />}
                            aria-label={`Delete credential ${credential.label}`}
                            title="Delete"
                            disabled={isRowActionPending}
                            onClick={() => void handleDelete(credential)}
                          />
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>
    </section>
  );
}
