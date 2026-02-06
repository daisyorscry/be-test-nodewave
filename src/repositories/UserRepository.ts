import { prisma } from "$utils/prisma.utils";
import type { DbClient } from "$entities/Db";
import type * as UserTypes from "$entities/user";

export function userRepository(db: DbClient = prisma) {
  return {
    listUsers: async (query?: Record<string, any>): Promise<UserTypes.UserWithRole[]> => {
      if (!query) {
        return db.user.findMany({
          include: { role: true }
        });
      }
      return db.user.findMany({
        include: { role: true },
        ...query
      });
    },

    getUserById: async (id: number): Promise<UserTypes.UserWithRole | null> => {
      return db.user.findUnique({
        where: { id },
        include: { role: true }
      });
    },

    getUserByEmail: async (email: string): Promise<UserTypes.UserWithRoleAndPassword | null> => {
      const result = await db.user.findUnique({
        where: { email },
        include: { role: true }
      });
      return result;
    },

    createUser: async (data: UserTypes.CreateUserData): Promise<UserTypes.UserWithRole> => {
      return db.user.create({
        data,
        include: { role: true }
      });
    },

    updateUser: async (id: number, data: UserTypes.UpdateUserData): Promise<UserTypes.UserWithRole> => {
      return db.user.update({
        where: { id },
        data,
        include: { role: true }
      });
    },

    deleteUser: async (id: number): Promise<UserTypes.UserWithRole> => {
      return db.user.delete({
        where: { id },
        include: { role: true }
      });
    }
  };
}

export function getUserRepo(tx?: DbClient) {
  return userRepository(tx ?? prisma);
}
