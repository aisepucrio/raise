import { useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/button";
import { FormInput } from "@/components/form";
import {
  getQueryErrorMessage,
  useLoginMutation,
  useMeQuery,
} from "@/data";

// Only same-app paths are followed after login, never another origin.
function safeNextPath(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const meQuery = useMeQuery();
  const loginMutation = useLoginMutation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Already logged in.
  if (meQuery.data) {
    return <Navigate to={nextPath} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!username || !password) return;
    try {
      await loginMutation.mutateAsync({ username, password });
      navigate(nextPath, { replace: true });
    } catch {
      // The error is shown from the mutation state.
    }
  }

  const status = (loginMutation.error as { status?: number } | null)?.status;
  const errorMessage = !loginMutation.isError
    ? null
    : status === 401
      ? "Wrong username or password, or the account is disabled."
      : getQueryErrorMessage(loginMutation.error, "Couldn't log in.");

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-sm space-y-5 rounded-xl border-2 border-(--color-secondary-soft) p-6"
        aria-labelledby="login-title"
      >
        <div className="space-y-3">
          <div className="dark:hidden">
            <img src="/LOGO_DARK.svg" alt="Dataminer" className="mx-auto h-auto w-48" />
          </div>
          <div className="hidden dark:block">
            <img src="/LOGO_LIGHT.svg" alt="Dataminer" className="mx-auto h-auto w-48" />
          </div>
          <h1
            id="login-title"
            className="text-center text-lg font-semibold text-(--color-secondary)"
          >
            Log in
          </h1>
        </div>

        <FormInput
          id="login-username"
          label="Username"
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
        <FormInput
          id="login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {errorMessage ? (
          <p role="alert" className="text-sm text-(--color-red)">
            {errorMessage}
          </p>
        ) : null}

        <Button
          type="submit"
          text={loginMutation.isPending ? "Logging in…" : "Log in"}
          icon={<LogIn />}
          disabled={loginMutation.isPending || !username || !password}
        />

        <p className="text-center text-xs text-(--color-secondary-muted)">
          No account? Ask an admin to create one.
        </p>
      </form>
    </main>
  );
}
