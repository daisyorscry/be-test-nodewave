export type RoleDTO = {
  id: number;
  name: string;
};

export type UserDTO = {
  id: number;
  email: string;
  name: string | null;
  role: RoleDTO;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserRequestDTO = {
  email: string;
  name?: string | null;
  roleId: number;
};

export type UpdateUserRequestDTO = {
  email?: string;
  name?: string | null;
  roleId?: number;
};

export type UserListResponseDTO = { users: UserDTO[] };
export type UserDetailResponseDTO = { user: UserDTO | null };
export type CreateUserResponseDTO = { user: UserDTO };
export type UpdateUserResponseDTO = { user: UserDTO };
export type DeleteUserResponseDTO = { user: UserDTO };
