export type UserWithRole = {
  id: number;
  email: string;
  name: string | null;
  roleId: number;
  createdAt: Date;
  updatedAt: Date;
  role: {
    id: number;
    name: string;
  };
};

export type UserWithRoleAndPassword = UserWithRole & {
  password: string;
};

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
