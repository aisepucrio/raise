// Roles, from least to most privileged (backend-go README, Roles).
export const userRoles = ["viewer", "researcher", "admin"] as const;

export type UserRole = (typeof userRoles)[number];

export type User = {
  id: number;
  username: string;
  role: UserRole;
  is_disabled: boolean;
  created_at: string;
};

export type LoginBody = {
  username: string;
  password: string;
};

// Any logged-in user, for their own account.
export type ChangePasswordBody = {
  current_password: string;
  new_password: string;
};

// Admin-only: there is no self-signup; admins create accounts.
export type CreateUserBody = {
  username: string;
  password: string;
  role: UserRole;
};

// Admin-only. Omitted fields stay as they are. Admins can't change their own
// role or disable or delete themselves (422).
export type UpdateUserBody = {
  username?: string;
  role?: UserRole;
  is_disabled?: boolean;
  password?: string;
};

// Must match minPasswordLength in backend-go/internal/auth/users.go.
export const MIN_PASSWORD_LENGTH = 12;

// Whether `role` grants at least `required`.
export function hasRole(role: UserRole | undefined, required: UserRole) {
  if (!role) return false;
  return userRoles.indexOf(role) >= userRoles.indexOf(required);
}
