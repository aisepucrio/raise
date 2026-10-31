import { api } from "../../api/apiClient";
import { endpoints } from "../../api/endpoints";
import type { RequestOptions } from "../shared";
import type {
  ChangePasswordBody,
  CreateUserBody,
  LoginBody,
  User,
} from "./authTypes";

export const authService = {
  // Starts a session; the API sets the HTTP-only session cookie.
  login: (body: LoginBody) =>
    api.post<User, User>(endpoints.login(), body),

  logout: () => api.post(endpoints.logout()),

  // Current user; rejects with 401 when there is no session.
  me: (options?: RequestOptions) =>
    api.get<User, User>(endpoints.me(), { signal: options?.signal }),

  // 204 on success; the API renews the session token, so the session stays.
  // A wrong current password is a 403.
  changePassword: (body: ChangePasswordBody) =>
    api.post(endpoints.changePassword(), body),

  // Admin only.
  listUsers: (options?: RequestOptions) =>
    api.get<User[], User[]>(endpoints.users(), { signal: options?.signal }),

  // Admin only.
  createUser: (body: CreateUserBody) =>
    api.post<User, User>(endpoints.users(), body),
};
