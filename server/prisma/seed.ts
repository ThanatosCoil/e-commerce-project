import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const email = "admin@gmail.com";
  const password = "admin";
  const name = "Super Admin";

  const existingSuperAdmin = await prisma.user.findFirst({
    where: {
      role: "SUPER_ADMIN",
    },
  });

  if (existingSuperAdmin) {
    console.log("Super Admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const superAdmin = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Super Admin created successfully", superAdmin.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
