import { PrismaClient } from "@prisma/client";
import { seedAdmin } from "./seedAdmin";

async function seed() {
  const prisma = new PrismaClient();

  try {
    await seedAdmin(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

seed().then(() => {
  console.log("ALL SEEDING DONE");
});
