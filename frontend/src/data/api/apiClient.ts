import axios from "axios";

// The Go API authenticates with a session cookie and only accepts browser
// writes from its own origin, so requests go to the frontend's origin
// (proxied to the API by Vite in development and nginx in production).
// VITE_API_URL is only for deployments that serve the API elsewhere.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Called when a request needs a session (401), so the auth state can send the
// user to the login screen. Login itself handles its own 401s.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const response = err.response;
    const url: string = err.config?.url ?? "";
    if (response?.status === 401 && !url.endsWith("/api/auth/login")) {
      onUnauthorized?.();
    }
    return Promise.reject(response ?? err);
  },
);

// Absolute URL of an API path on the same origin as the requests above, for
// plain links such as exports and the API docs.
export function apiUrl(path: string, params?: URLSearchParams) {
  const base = import.meta.env.VITE_API_URL || "";
  const query = params?.toString();
  return `${base}${path}${query ? `?${query}` : ""}`;
}
