import { PrismaClient, Prisma, FacilityStatus, ReservationStatus, EquipmentReturnStatus, AdminRole } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureAdmin() {
  return prisma.admin.upsert({
    where: { username: "admin" },
    update: {
      name: "Main Admin",
      birthdate: new Date("1990-01-01"),
      gender: "Male",
      address: "Barangay Hall",
      contactNumber: "09123456789",
      email: "admin@example.com",
      role: AdminRole.ADMIN,
      isActive: true,
    },
    create: {
      name: "Main Admin",
      birthdate: new Date("1990-01-01"),
      gender: "Male",
      address: "Barangay Hall",
      username: "admin",
      password: "admin123",
      contactNumber: "09123456789",
      email: "admin@example.com",
      role: AdminRole.ADMIN,
      isActive: true,
    },
  });
}

async function ensureUser() {
  return prisma.user.upsert({
    where: { username: "user1" },
    update: {
      name: "User One",
      birthdate: new Date("2001-01-01"),
      gender: "Female",
      address: "Barangay 1",
      contactNumber: "09999999999",
      email: "user1@example.com",
    },
    create: {
      name: "User One",
      birthdate: new Date("2001-01-01"),
      gender: "Female",
      address: "Barangay 1",
      username: "user1",
      password: "user123",
      contactNumber: "09999999999",
      email: "user1@example.com",
    },
  });
}

async function ensureEquipment(adminId: number) {
  const equipmentItems = [
    {
      itemName: "Foldable Chair",
      description: "Plastic foldable chair for meetings and events",
      price: new Prisma.Decimal("25.00"),
      quantity: 100,
    },
    {
      itemName: "Event Tent",
      description: "10x10 ft outdoor event tent with basic setup",
      price: new Prisma.Decimal("1500.00"),
      quantity: 6,
    },
    {
      itemName: "Wired Microphone",
      description: "Standard wired microphone for programs and announcements",
      price: new Prisma.Decimal("300.00"),
      quantity: 10,
    },
    {
      itemName: "Sound System",
      description: "Basic PA sound system set with mixer and amplifier",
      price: new Prisma.Decimal("2500.00"),
      quantity: 3,
    },
    {
      itemName: "Folding Table",
      description: "6 ft rectangular folding table for events and meetings",
      price: new Prisma.Decimal("150.00"),
      quantity: 30,
    },
    {
      itemName: "Projector",
      description: "HD projector for presentations and community programs",
      price: new Prisma.Decimal("1200.00"),
      quantity: 3,
    },
    {
      itemName: "Portable Speaker",
      description: "Rechargeable portable speaker for small gatherings",
      price: new Prisma.Decimal("700.00"),
      quantity: 8,
    },
  ];

  const savedEquipment = [];

  for (const item of equipmentItems) {
    const existing = await prisma.equipment.findFirst({
      where: {
        itemName: item.itemName,
        adminId,
      },
    });

    if (existing) {
      savedEquipment.push(
        await prisma.equipment.update({
          where: { equipmentId: existing.equipmentId },
          data: {
            description: item.description,
            price: item.price,
            quantity: item.quantity,
          },
        })
      );
    } else {
      savedEquipment.push(
        await prisma.equipment.create({
          data: {
            adminId,
            itemName: item.itemName,
            description: item.description,
            price: item.price,
            quantity: item.quantity,
          },
        })
      );
    }
  }

  return savedEquipment;
}

async function ensureFacility(adminId: number) {
  const existing = await prisma.facility.findFirst({
    where: {
      itemName: "Covered Court",
      adminId,
    },
  });

  if (existing) {
    return prisma.facility.update({
      where: { facilityId: existing.facilityId },
      data: {
        description: "Community covered court",
        status: FacilityStatus.AVAILABLE,
        pricePerDay: 500,
      },
    });
  }

  return prisma.facility.create({
    data: {
      adminId,
      itemName: "Covered Court",
      description: "Community covered court",
      status: FacilityStatus.AVAILABLE,
      pricePerDay: 500,
    },
  });
}

async function ensureEquipmentReservation(userId: number, adminId: number, equipmentId: number) {
  const startDateTime = new Date("2026-05-01T08:00:00.000Z");
  const endDateTime = new Date("2026-05-01T12:00:00.000Z");

  const existing = await prisma.reservation.findFirst({
    where: {
      userId,
      equipmentId,
      startDateTime,
      endDateTime,
    },
  });

  if (existing) {
    return prisma.reservation.update({
      where: { reservationId: existing.reservationId },
      data: {
        adminId,
        purpose: "Barangay meeting equipment use",
        status: ReservationStatus.PENDING,
        expectedAttendees: null,
        equipmentQuantity: 10,
        approvedAt: null,
        returnedAt: null,
        cancelledAt: null,
        returnStatus: null,
        adminNotes: null,
      },
    });
  }

  return prisma.reservation.create({
    data: {
      userId,
      equipmentId,
      adminId,
      facilityId: null,
      startDateTime,
      endDateTime,
      purpose: "Barangay meeting equipment use",
      status: ReservationStatus.PENDING,
      expectedAttendees: null,
      equipmentQuantity: 10,
      approvedAt: null,
      returnedAt: null,
      cancelledAt: null,
      returnStatus: null,
      adminNotes: null,
    },
  });
}

async function ensureFacilityReservation(userId: number, adminId: number, facilityId: number) {
  const startDateTime = new Date("2026-05-02T08:00:00.000Z");
  const endDateTime = new Date("2026-05-02T17:00:00.000Z");

  const existing = await prisma.reservation.findFirst({
    where: {
      userId,
      facilityId,
      startDateTime,
      endDateTime,
    },
  });

  if (existing) {
    return prisma.reservation.update({
      where: { reservationId: existing.reservationId },
      data: {
        adminId,
        purpose: "Barangay event reservation",
        status: ReservationStatus.PENDING,
        expectedAttendees: 100,
        equipmentQuantity: null,
        approvedAt: null,
        returnedAt: null,
        cancelledAt: null,
        returnStatus: null,
        adminNotes: null,
      },
    });
  }

  return prisma.reservation.create({
    data: {
      userId,
      equipmentId: null,
      adminId,
      facilityId,
      startDateTime,
      endDateTime,
      purpose: "Barangay event reservation",
      status: ReservationStatus.PENDING,
      expectedAttendees: 100,
      equipmentQuantity: null,
      approvedAt: null,
      returnedAt: null,
      cancelledAt: null,
      returnStatus: null,
      adminNotes: null,
    },
  });
}

async function main() {
  console.log("Seeding started...");

  const admin = await ensureAdmin();
  const user = await ensureUser();
  const equipment = await ensureEquipment(admin.adminId);
  const facility = await ensureFacility(admin.adminId);

  await ensureEquipmentReservation(user.userId, admin.adminId, equipment[0].equipmentId);
  await ensureFacilityReservation(user.userId, admin.adminId, facility.facilityId);

  console.log("Seeding finished successfully.");
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });