import { createBrowserRouter } from "react-router-dom";

import Layout from "./layout";
import NotFound from "./pages/NotFound";
import { RequireAuth, RequireRole } from "./auth/RequireAuth";

// pages
import OverviewPage from "./pages/OverviewPage";
import CollectPage from "./pages/CollectPage";
import PreviewPage from "./pages/PreviewPage";
import JobsPage from "./pages/JobsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CredentialsPage from "./pages/CredentialsPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import EntitiesPage from "./pages/EntitiesPage";

export const router = createBrowserRouter([
  // Public: the only route without a session.
  { path: "/login", element: <LoginPage />, errorElement: <NotFound /> },
  {
    // Everything else needs a session (GET /api/auth/me).
    element: <RequireAuth />,
    errorElement: <NotFound />,
    children: [
      {
        path: "/",
        element: <Layout />,
        children: [
          { index: true, element: <OverviewPage /> },
          { path: "overview", element: <OverviewPage /> },
          { path: "collect", element: <CollectPage /> },
          { path: "jobs", element: <JobsPage /> },
          { path: "preview", element: <PreviewPage /> },
          {
            path: "register",
            element: (
              <RequireRole role="admin">
                <RegisterPage />
              </RequireRole>
            ),
          },
          {
            // What the selected source mines from (repositories, projects,
            // tags). Removes mined data for everyone, so admins only.
            path: "entities",
            element: (
              <RequireRole role="admin">
                <EntitiesPage />
              </RequireRole>
            ),
          },
          {
            // Researchers see the pool; only admins change it.
            path: "credentials",
            element: (
              <RequireRole role="researcher">
                <CredentialsPage />
              </RequireRole>
            ),
          },
          // Every role, for their own account.
          { path: "password", element: <ChangePasswordPage /> },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);
