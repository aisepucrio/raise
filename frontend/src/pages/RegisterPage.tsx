import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";

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
  MIN_PASSWORD_LENGTH,
  getQueryErrorMessage,
  useCreateUserMutation,
  useUsersQuery,
  userRoles,
  type UserRole,
} from "@/data";

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  viewer: "Read and export everything",
  researcher: "Also register repositories and start or cancel collections",
  admin: "Also manage users and credentials",
};

// Admin-only: there is no self-signup, so admins register accounts here
// (POST /api/users) and hand the password to the person.
export default function RegisterPage() {
  const usersQuery = useUsersQuery();
  const createUserMutation = useCreateUserMutation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("researcher");
  const [submitted, setSubmitted] = useState(false);

  const passwordError =
    password.length > 0 && password.length < MIN_PASSWORD_LENGTH
      ? `At least ${MIN_PASSWORD_LENGTH} characters.`
      : undefined;
  const confirmError =
    confirmPassword.length > 0 && confirmPassword !== password
      ? "Passwords don't match."
      : undefined;
  const isValid =
    username.trim().length > 0 &&
    password.length >= MIN_PASSWORD_LENGTH &&
    confirmPassword === password;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!isValid) return;
    try {
      const user = await createUserMutation.mutateAsync({
        username: username.trim(),
        password,
        role,
      });
      toast.success(undefined, {
        description: `Registered ${user.username} as ${user.role}.`,
      });
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setSubmitted(false);
    } catch {
      // The error is shown from the mutation state.
    }
  }

  const status = (createUserMutation.error as { status?: number } | null)?.status;
  const errorMessage = !createUserMutation.isError
    ? null
    : status === 409
      ? "That username is taken."
      : getQueryErrorMessage(createUserMutation.error, "Couldn't register the user.");

  return (
    <section className="flex h-full min-h-0 flex-col gap-4 overflow-auto">
      <PageHeader
        title="Users"
        subtitle="Create accounts for the lab. There is no self-signup: share the password with the person, who can change it later."
      />

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="grid max-w-3xl gap-4 rounded-xl border-2 border-(--color-secondary-soft) p-4 md:grid-cols-2"
        aria-label="Register user"
      >
        <FormInput
          id="register-username"
          label="Username"
          autoComplete="off"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          error={submitted && !username.trim() ? "Required." : undefined}
          required
        />
        <FormSelect
          id="register-role"
          label="Role"
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
          hint={ROLE_DESCRIPTIONS[role]}
        >
          {userRoles.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </FormSelect>
        <FormInput
          id="register-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          error={passwordError}
          required
        />
        <FormInput
          id="register-confirm-password"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={confirmError}
          required
        />

        {errorMessage ? (
          <p role="alert" className="text-sm text-(--color-red) md:col-span-2">
            {errorMessage}
          </p>
        ) : null}

        <div className="md:col-span-2">
          <Button
            type="submit"
            fullWidth={false}
            text={createUserMutation.isPending ? "Registering…" : "Register user"}
            icon={<UserPlus />}
            disabled={createUserMutation.isPending || !isValid}
          />
        </div>
      </form>

      <section className="max-w-3xl space-y-2">
        <h2 className="text-sm font-semibold text-(--color-secondary)">Users</h2>
        {usersQuery.isError ? (
          <p className="text-sm text-(--color-red)">
            {getQueryErrorMessage(usersQuery.error, "Failed to load users.")}
          </p>
        ) : null}
        <div className="rounded-xl border-2 border-(--color-secondary-soft) p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.isPending ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="h-12">
                      <Loader />
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
              {(usersQuery.data ?? []).map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.is_disabled ? "Disabled" : "Active"}</TableCell>
                  <TableCell>
                    <FormatDateItem value={user.created_at} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </section>
  );
}
