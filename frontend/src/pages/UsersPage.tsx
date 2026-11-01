import { useState, type FormEvent } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";

import { Button } from "@/components/button";
import { FormatDateItem } from "@/components/format-date-item";
import { FormInput, FormSelect } from "@/components/form";
import { Loader } from "@/components/loader";
import { ModalShell } from "@/components/modal-shell";
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
  useDeleteUserMutation,
  useMeQuery,
  useUpdateUserMutation,
  useUsersQuery,
  userRoles,
  type UpdateUserBody,
  type User,
  type UserRole,
} from "@/data";

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  viewer: "Read and export everything",
  researcher: "Also register repositories and start or cancel collections",
  admin: "Also manage users and credentials",
};

// The user being edited, or "new" for the add form.
type Editing = User | "new" | null;

// Admin-only: there is no self-signup, so admins add accounts here and hand
// the password to the person. Admins can also rename users, change their
// role, disable them, reset their password, or delete them. The API refuses
// role changes, disabling and deleting for the admin's own account, so there
// is always an admin left.
export default function UsersPage() {
  const { data: currentUser } = useMeQuery();
  const usersQuery = useUsersQuery();
  const deleteMutation = useDeleteUserMutation();
  const [editing, setEditing] = useState<Editing>(null);

  async function handleDelete(user: User) {
    if (
      !window.confirm(
        `Delete the user "${user.username}"? Their API keys stop working. The collections and credentials they added are kept. This can't be undone.`,
      )
    ) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(user.id);
      toast.success(undefined, { description: `Deleted ${user.username}.` });
    } catch (error) {
      toast.error(undefined, {
        description: getQueryErrorMessage(error, "Couldn't delete the user."),
      });
    }
  }

  const users = usersQuery.data ?? [];

  return (
    <section className="flex h-full min-h-0 flex-col gap-4 overflow-auto">
      <PageHeader
        title="Users"
        subtitle="Manage the lab's accounts. There is no self-signup: add an account and share the password with the person, who can change it later."
      />

      <div>
        <Button
          fullWidth={false}
          text="Add user"
          icon={<UserPlus />}
          onClick={() => setEditing("new")}
        />
      </div>

      <section className="max-w-4xl space-y-2">
        {usersQuery.isError ? (
          <p className="text-sm text-(--color-red)">
            {getQueryErrorMessage(usersQuery.error, "Failed to load users.")}
          </p>
        ) : null}
        <div className="overflow-auto rounded-xl border-2 border-(--color-secondary-soft) p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.isPending ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="h-12">
                      <Loader />
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
              {users.map((user) => {
                const isSelf = user.id === currentUser?.id;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.username}
                      {isSelf ? (
                        <span className="ml-2 text-xs font-normal text-(--color-secondary-muted)">
                          (you)
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <span
                        className="font-semibold"
                        style={{
                          color: user.is_disabled ? "var(--color-slate)" : "var(--color-teal)",
                        }}
                      >
                        {user.is_disabled ? "Disabled" : "Active"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <FormatDateItem value={user.created_at} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          fullWidth={false}
                          className="w-9 min-h-8.5 px-0 py-0"
                          icon={<Pencil />}
                          aria-label={`Edit user ${user.username}`}
                          title="Edit"
                          onClick={() => setEditing(user)}
                        />
                        <Button
                          fullWidth={false}
                          className="w-9 min-h-8.5 px-0 py-0"
                          icon={<Trash2 />}
                          aria-label={`Delete user ${user.username}`}
                          title={isSelf ? "You can't delete your own account" : "Delete"}
                          disabled={isSelf || deleteMutation.isPending}
                          onClick={() => void handleDelete(user)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      {editing ? (
        <UserFormModal
          // Remounts the form, so it starts from the chosen user's values.
          key={editing === "new" ? "new" : editing.id}
          user={editing === "new" ? null : editing}
          isSelf={editing !== "new" && editing.id === currentUser?.id}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </section>
  );
}

type UserFormModalProps = {
  // null adds a user.
  user: User | null;
  isSelf: boolean;
  onClose: () => void;
};

// Adds a user, or edits one. When editing, the password fields are optional
// (left empty, the password is kept) and only changed fields are sent.
function UserFormModal({ user, isSelf, onClose }: UserFormModalProps) {
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const mutation = user ? updateMutation : createMutation;

  const [username, setUsername] = useState(user?.username ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "researcher");
  const [isDisabled, setIsDisabled] = useState(user?.is_disabled ?? false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const passwordRequired = !user;
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
    (passwordRequired || password.length > 0
      ? password.length >= MIN_PASSWORD_LENGTH && confirmPassword === password
      : true);

  function changes(existing: User): UpdateUserBody {
    const body: UpdateUserBody = {};
    if (username.trim() !== existing.username) body.username = username.trim();
    if (!isSelf && role !== existing.role) body.role = role;
    if (!isSelf && isDisabled !== existing.is_disabled) body.is_disabled = isDisabled;
    if (password) body.password = password;
    return body;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!isValid) return;
    try {
      if (user) {
        const body = changes(user);
        if (Object.keys(body).length === 0) {
          onClose();
          return;
        }
        const updated = await updateMutation.mutateAsync({ id: user.id, body });
        toast.success(undefined, { description: `Saved ${updated.username}.` });
      } else {
        const created = await createMutation.mutateAsync({
          username: username.trim(),
          password,
          role,
        });
        toast.success(undefined, {
          description: `Added ${created.username} as ${created.role}.`,
        });
      }
      onClose();
    } catch {
      // The error is shown from the mutation state.
    }
  }

  const status = (mutation.error as { status?: number } | null)?.status;
  const errorMessage = !mutation.isError
    ? null
    : status === 409
      ? "That username is taken."
      : getQueryErrorMessage(
          mutation.error,
          user ? "Couldn't save the user." : "Couldn't add the user.",
        );

  return (
    <ModalShell
      open
      onClose={onClose}
      title={user ? `Edit ${user.username}` : "Add user"}
      subtitle={
        user
          ? "Leave the password empty to keep it."
          : "Share the password with the person; they can change it later."
      }
    >
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="grid gap-4"
        aria-label={user ? "Edit user" : "Add user"}
      >
        <FormInput
          id="user-username"
          label="Username"
          autoComplete="off"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          error={submitted && !username.trim() ? "Required." : undefined}
          required
          autoFocus
        />
        <FormSelect
          id="user-role"
          label="Role"
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
          hint={isSelf ? "You can't change your own role." : ROLE_DESCRIPTIONS[role]}
          disabled={isSelf}
        >
          {userRoles.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </FormSelect>
        {user ? (
          <FormSelect
            id="user-status"
            label="Status"
            value={isDisabled ? "disabled" : "active"}
            onChange={(event) => setIsDisabled(event.target.value === "disabled")}
            hint={
              isSelf
                ? "You can't disable your own account."
                : "Disabled users can't log in, and their sessions and API keys stop working."
            }
            disabled={isSelf}
          >
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </FormSelect>
        ) : null}
        {isSelf ? (
          <p className="text-xs text-(--color-secondary-muted)">
            Change your own password with the lock button next to Log out.
          </p>
        ) : (
          <>
            <FormInput
              id="user-password"
              label={user ? "New password" : "Password"}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
              error={passwordError}
              required={passwordRequired}
            />
            <FormInput
              id="user-confirm-password"
              label={user ? "Confirm new password" : "Confirm password"}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={confirmError}
              required={passwordRequired || password.length > 0}
            />
          </>
        )}

        {errorMessage ? (
          <p role="alert" className="text-sm text-(--color-red)">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button fullWidth={false} variant="selectable" text="Cancel" onClick={onClose} />
          <Button
            type="submit"
            fullWidth={false}
            text={
              mutation.isPending
                ? user
                  ? "Saving…"
                  : "Adding…"
                : user
                  ? "Save"
                  : "Add user"
            }
            disabled={mutation.isPending || !isValid}
          />
        </div>
      </form>
    </ModalShell>
  );
}
