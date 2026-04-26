import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  // Create Admin safely (no duplicate crash)
  const admin = await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Admin",
      birthdate: new Date("2000-01-01"),
      gender: "Male",
      address: "Barangay",
      username: "admin",
      password: "admin123",
      contactNumber: "09123456789",
      email: "admin@test.com",
    },
  });

  // Create User
  const user = await prisma.user.upsert({
    where: { username: "user1" },
    update: {},
    create: {
      name: "User One",
      birthdate: new Date("2002-01-01"),
      gender: "Female",
      address: "Barangay",
      username: "user1",
      password: "user123",
      contactNumber: "09999999999",
      email: "user@test.com",
    },
  });

  // Create Equipment
  await prisma.equipment.create({
    data: {
      adminId: admin.adminId,
      itemName: "Chair",
      description: "Plastic chair",
      quantity: 50,
      price: 10,
    },
  });

  // Create Facility
  await prisma.facility.create({
    data: {
      adminId: admin.adminId,
      itemName: "Covered Court",
      description: "Basketball court",
      pricePerDay: 500,
    },
  });

  console.log("Seeding done.");
}

main()
  .catch((e) => {
    console.error("SEED ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });