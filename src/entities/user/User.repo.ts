import { Prisma } from "@prisma/client/wasm";

export type UserWithRole = Prisma.UserGetPayload<{
  include: { role: true };
}>;

export type CreateUserData = {
  email: string;
  name: string | null;
  roleId: number;
};
export type UpdateUserData = {
  email?: string;
  name?: string | null;
  roleId?: number;
};
