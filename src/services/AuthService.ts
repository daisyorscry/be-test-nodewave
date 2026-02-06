import bcrypt from "bcrypt";
import * as Service from "$entities/Service";
import * as UserRepo from "$repositories/UserRepository";
import { signJwt } from "$pkg/jwt";

export async function login(email: string, password: string): Promise<Service.ServiceResponse<{ token: string }>> {
  try {
    const repo = UserRepo.getUserRepo();
    const user = await repo.getUserByEmail(email);

    if (!user) {
      return Service.ErrorResponse("Invalid credentials", 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return Service.ErrorResponse("Invalid credentials", 401);
    }

    const token = signJwt({ userId: user.id, role: user.role.name });
    return Service.SuccessResponse({ token });
  } catch {
    return Service.INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}
