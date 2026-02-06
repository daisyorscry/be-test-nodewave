async function seed(){
    // Seed Function Call Goes Here
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const { seedAdmin } = await import("./seedAdmin");

    try {
      await seedAdmin(prisma);
    } finally {
      await prisma.$disconnect();
    }
}

seed().then(()=>{
    console.log("ALL SEEDING DONE")
})
