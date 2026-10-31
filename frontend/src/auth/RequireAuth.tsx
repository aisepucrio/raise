import { useEffect, type ReactNode } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/button";
import { Loader } from "@/components/loader";
import {
  getQueryErrorMessage,
  hasRole,
  queryClient,
  setUnauthorizedHandler,
  useMeQuery,
  type UserRole,
} from "@/data";

// Path and query of the current location, to come back to after logging in.
function useReturnPath() {
  const location = useLocation();
  return `${location.pathname}${location.search}`;
}

export function loginPath(next: string) {
  return next && next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login";
}

// Guards the app's routes: renders them only with a session, and sends the
// user to the login screen when there is none or it expires (any 401).
export function RequireAuth() {
  const meQuery = useMeQuery();
  const navigate = useNavigate();
  const returnPath = useReturnPath();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.clear();
      navigate(loginPath(window.location.pathname + window.location.search), {
        replace: true,
      });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  if (meQuery.isPending) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-16 w-16">
          <Loader />
        </div>
      </div>
    );
  }

  if (meQuery.isError) {
    if ((meQuery.error as { status?: number })?.status === 401) {
      return <Navigate to={loginPath(returnPath)} replace />;
    }
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-(--color-red)">
          {getQueryErrorMessage(meQuery.error, "Couldn't reach the API.")}
        </p>
        <Button
          fullWidth={false}
          text="Try again"
          onClick={() => void meQuery.refetch()}
        />
      </div>
    );
  }

  return <Outlet />;
}

// Renders children only for users with at least `role`.
export function RequireRole({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const { data: user } = useMeQuery();

  if (!hasRole(user?.role, role)) {
    return (
      <div className="m-auto space-y-2 text-center">
        <h1 className="text-2xl font-bold">403</h1>
        <p className="opacity-80">This page needs the {role} role.</p>
      </div>
    );
  }
  return <>{children}</>;
}
