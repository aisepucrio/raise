import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";

import { Button } from "@/components/button";
import { FormInput } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { toast } from "@/components/toast";
import {
  MIN_PASSWORD_LENGTH,
  getQueryErrorMessage,
  useChangePasswordMutation,
  useMeQuery,
} from "@/data";

// Any logged-in user changes their own password (POST /api/auth/password).
// The session stays valid: the API renews its token.
export default function ChangePasswordPage() {
  const { data: currentUser } = useMeQuery();
  const changePasswordMutation = useChangePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const newPasswordError =
    newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH
      ? `At least ${MIN_PASSWORD_LENGTH} characters.`
      : newPassword.length > 0 && newPassword === currentPassword
        ? "Choose a password different from the current one."
        : undefined;
  const confirmError =
    confirmPassword.length > 0 && confirmPassword !== newPassword
      ? "Passwords don't match."
      : undefined;
  const isValid =
    currentPassword.length > 0 &&
    newPassword.length >= MIN_PASSWORD_LENGTH &&
    newPassword !== currentPassword &&
    confirmPassword === newPassword;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;
    try {
      await changePasswordMutation.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success(undefined, { description: "Your password was changed." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      changePasswordMutation.reset();
    } catch {
      // The error is shown from the mutation state.
    }
  }

  const status = (changePasswordMutation.error as { status?: number } | null)
    ?.status;
  const errorMessage = !changePasswordMutation.isError
    ? null
    : status === 403
      ? "The current password is wrong."
      : getQueryErrorMessage(
          changePasswordMutation.error,
          "Couldn't change the password.",
        );

  return (
    <section className="flex h-full min-h-0 flex-col gap-4 overflow-auto">
      <PageHeader
        title="Change password"
        subtitle={
          currentUser
            ? `Signed in as ${currentUser.username}. You stay logged in after changing it.`
            : "You stay logged in after changing it."
        }
      />

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="grid max-w-md gap-4 rounded-xl border-2 border-(--color-secondary-soft) p-4"
        aria-label="Change password"
      >
        <FormInput
          id="change-password-current"
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
        <FormInput
          id="change-password-new"
          label="New password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          error={newPasswordError}
          required
        />
        <FormInput
          id="change-password-confirm"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={confirmError}
          required
        />

        {errorMessage ? (
          <p role="alert" className="text-sm text-(--color-red)">
            {errorMessage}
          </p>
        ) : null}

        <div>
          <Button
            type="submit"
            fullWidth={false}
            text={
              changePasswordMutation.isPending ? "Changing…" : "Change password"
            }
            icon={<Lock />}
            disabled={changePasswordMutation.isPending || !isValid}
          />
        </div>
      </form>
    </section>
  );
}
