import type * as UserTypes from "$entities/user";

export function toUserDTO(user: UserTypes.UserWithRole): UserTypes.UserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: {
      id: user.role.id,
      name: user.role.name
    },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export function toCreateUserData(payload: UserTypes.CreateUserRequestDTO): {
  email: string;
  name: string | null;
  roleId: number;
} {
  return {
    email: payload.email,
    name: payload.name ?? null,
    roleId: payload.roleId
  };
}

export function toUpdateUserData(payload: UserTypes.UpdateUserRequestDTO): {
  email?: string;
  name?: string | null;
  roleId?: number;
} {
  return {
    email: payload.email,
    name: payload.name,
    roleId: payload.roleId
  };
}

export function toUserResponse(user: UserTypes.UserWithRole): { user: UserTypes.UserDTO } {
  return { user: toUserDTO(user) };
}
