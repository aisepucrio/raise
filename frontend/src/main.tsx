import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { queryClient } from "@/data";
import { ThemeProvider } from "./lib/theme-context";
import { Toast } from "./components/toast";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toast closeButton richColors position="top-center" />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
