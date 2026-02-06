import Logger from "$pkg/logger";
import { prisma } from "$utils/prisma.utils";
import type { Prisma } from "@prisma/client";
import * as Service from "$entities/Service";
import type * as UserTypes from "$entities/user";
import * as UserMapper from "$mappers/UserMapper";
import * as UserRepo from "$repositories/UserRepository";
import { withRedisLock } from "$utils/lock.utils";
import { cacheDel, cacheGet, cacheSet } from "$utils/redis.utils";

function isLockError(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === "object" &&
      "name" in err &&
      (err as { name?: string }).name === "LockError"
  );
}


export async function list(): Promise<Service.ServiceResponse<UserTypes.UserListResponseDTO>> {
  try {
    const repo = UserRepo.getUserRepo();
    const users = await repo.listUsers();

    return Service.SuccessResponse({ users: users.map((user) => UserMapper.toUserDTO(user)) });
  } catch (err) {
    Logger.error(`UserService.list : ${err}`);
    return Service.INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function getById(id: number): Promise<Service.ServiceResponse<UserTypes.UserDetailResponseDTO>> {
  try {
    const cacheKey = `user:${id}`;
    const cached = await cacheGet<UserTypes.UserDetailResponseDTO>(cacheKey);
    if (cached) {
      return Service.SuccessResponse(cached);
    }

    const repo = UserRepo.getUserRepo();
    const user = await repo.getUserById(id);

    if (!user) {
      return Service.ErrorResponse("User not found", 404);
    }

    const response = { user: UserMapper.toUserDTO(user) };
    await cacheSet(cacheKey, response, 60);
    return Service.SuccessResponse(response);
  } catch (err) {
    Logger.error(`UserService.getById : ${err}`);
    return Service.INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function create(payload: UserTypes.CreateUserRequestDTO): Promise<Service.ServiceResponse<UserTypes.CreateUserResponseDTO>> {
  try {
    const lockKey = `lock:user:email:${payload.email}`;
    return await withRedisLock(lockKey, 10000, async () => {
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const repo = UserRepo.getUserRepo(tx);
        const existing = await repo.getUserByEmail(payload.email);

        if (existing) {
          return Service.ErrorResponse("Email already exists", 409);
        }

      const user = await repo.createUser(UserMapper.toCreateUserData(payload));

      const response = UserMapper.toUserResponse(user);
      await cacheDel(`user:${user.id}`);
      return Service.SuccessResponse(response);
    });

      return result;
    });
  } catch (err) {
    if (isLockError(err)) {
      return Service.ErrorResponse("Resource is busy, try again", 409);
    }
    Logger.error(`UserService.create : ${err}`);
    return Service.INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function update(id: number, payload: UserTypes.UpdateUserRequestDTO): Promise<Service.ServiceResponse<UserTypes.UpdateUserResponseDTO>> {
  try {
    const lockKey = `lock:user:${id}`;
    return await withRedisLock(lockKey, 10000, async () => {
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const repo = UserRepo.getUserRepo(tx);
        const existing = await repo.getUserById(id);
        if (!existing) {
          return Service.ErrorResponse("User not found", 404);
        }

      const user = await repo.updateUser(id, UserMapper.toUpdateUserData(payload));

      const response = UserMapper.toUserResponse(user);
      await cacheDel(`user:${id}`);
      return Service.SuccessResponse(response);
    });

      return result;
    });
  } catch (err) {
    if (isLockError(err)) {
      return Service.ErrorResponse("Resource is busy, try again", 409);
    }
    Logger.error(`UserService.update : ${err}`);
    return Service.INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function remove(id: number): Promise<Service.ServiceResponse<UserTypes.DeleteUserResponseDTO>> {
  try {
    const lockKey = `lock:user:${id}`;
    return await withRedisLock(lockKey, 10000, async () => {
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const repo = UserRepo.getUserRepo(tx);
        const existing = await repo.getUserById(id);
        if (!existing) {
          return Service.ErrorResponse("User not found", 404);
        }

      const user = await repo.deleteUser(id);

      const response = UserMapper.toUserResponse(user);
      await cacheDel(`user:${id}`);
      return Service.SuccessResponse(response);
    });

      return result;
    });
  } catch (err) {
    if (isLockError(err)) {
      return Service.ErrorResponse("Resource is busy, try again", 409);
    }
    Logger.error(`UserService.remove : ${err}`);
    return Service.INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}
