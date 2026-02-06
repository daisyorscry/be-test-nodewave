import type { Prisma } from "@prisma/client";

export type UserWithRoleAndPassword = Prisma.UserGetPayload<{
  include: { role: true };
}>;

export type UserWithRole = Omit<UserWithRoleAndPassword, "password">;

export type CreateUserData = {
  email: string;
  name: string | null;
  roleId: number;
  password: string;
};
export type UpdateUserData = {
  email?: string;
  name?: string | null;
  roleId?: number;
  password?: string;
};
