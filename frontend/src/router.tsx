import { createBrowserRouter } from "react-router-dom";

import Layout from "./layout";
import NotFound from "./pages/NotFound";

// pages
import OverviewPage from "./pages/OverviewPage";
import CollectPage from "./pages/CollectPage";
import PreviewPage from "./pages/PreviewPage";
import JobsPage from "./pages/JobsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: "overview", element: <OverviewPage /> },
      { path: "collect", element: <CollectPage /> },
      { path: "jobs", element: <JobsPage /> },
      { path: "preview", element: <PreviewPage /> },
    ],
  },
]);
