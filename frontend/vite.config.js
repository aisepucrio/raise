import { defineConfig, loadEnv } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // API_PROXY_TARGET has no VITE_ prefix, so it never reaches the bundle.
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.API_PROXY_TARGET || "http://localhost:8000";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    // The Go API's session cookie and CSRF protection need the frontend and
    // the API on one origin, so the dev server proxies the API (as nginx does
    // in production). The Host header is kept, so the API sees the same origin.
    server: {
      proxy: {
        "/api": { target: apiTarget },
        "/healthz": { target: apiTarget },
      },
    },
  };
});
