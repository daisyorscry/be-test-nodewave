import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

export async function seedAdmin(prisma: PrismaClient) {
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN" }
  });

  await prisma.role.upsert({
    where: { name: "USER" },
    update: {},
    create: { name: "USER" }
  });

  const countAdmin = await prisma.user.count({
    where: { roleId: adminRole.id }
  });

  if (countAdmin === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 12);

    await prisma.user.create({
      data: {
        name: "Admin",
        password: hashedPassword,
        email: "admin@test.com",
        roleId: adminRole.id
      }
    });

    console.log("Admin seeded");
    return;
  }

  console.log("Admin already seeded");
}
