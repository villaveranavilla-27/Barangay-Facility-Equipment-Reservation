import {
  PrismaClient,
  EquipmentReturnStatus,
  FacilityStatus,
  ReservationStatus,
} from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// MD5 replacement (safe for Node runtime)
function md5(value: string) {
  return crypto.createHash("md5").update(value).digest("hex");
}

const demoAdmin = {
  name: "Admin",
  birthdate: new Date("1990-01-01"),
  gender: "Female",
  address: "Barangay Hall",
  username: "admin",
  email: "admin@example.com",
  password: "admin123",
  contactNumber: "0912345678",
} as const;

const demoUser = {
  name: "Juan Dela Cruz",
  birthdate: new Date("1998-03-14"),
  gender: "Male",
  address: "Purok 1",
  username: "user",
  email: "user@example.com",
  password: "user123",
  contactNumber: "0917000000",
} as const;

const demoEquipment = [
  { itemName: "Chairs", description: "Stackable plastic chair.", price: 25, quantity: 100 },
  { itemName: "Microphone", description: "Wireless handheld microphone.", price: 150, quantity: 6 },
  { itemName: "Sound System", description: "Complete sound system with wireless microphones.", price: 800, quantity: 2 },
  { itemName: "Speaker", description: "Portable Bluetooth speaker.", price: 300, quantity: 4 },
  { itemName: "Projector", description: "HD projector with screen.", price: 500, quantity: 2 },
  { itemName: "Tables", description: "Foldable banquet tables.", price: 75, quantity: 20 },
  { itemName: "Tent", description: "Tent with frame and setup.", price: 650, quantity: 3 },
] as const;

async function main() {
  const result = await prisma.$transaction(async (tx) => {
    // clear existing data
    await tx.reservation.deleteMany();
    await tx.equipment.deleteMany();
    await tx.facility.deleteMany();
    await tx.admin.deleteMany();
    await tx.user.deleteMany();

    // create admin
    const admin = await tx.admin.create({
      data: {
        name: demoAdmin.name,
        birthdate: demoAdmin.birthdate,
        gender: demoAdmin.gender,
        address: demoAdmin.address,
        username: demoAdmin.username,
        email: demoAdmin.email,
        password: md5(demoAdmin.password),
        contactNumber: demoAdmin.contactNumber,
      },
    });

    // create user
    const user = await tx.user.create({
      data: {
        name: demoUser.name,
        birthdate: demoUser.birthdate,
        gender: demoUser.gender,
        address: demoUser.address,
        username: demoUser.username,
        email: demoUser.email,
        password: md5(demoUser.password),
        contactNumber: demoUser.contactNumber,
      },
    });

    // create facility
    const facility = await tx.facility.create({
      data: {
        adminId: admin.adminId,
        itemName: "Barangay Covered Court Complex",
        description: "Roofed venue with stage, lights, and basic facilities.",
        status: FacilityStatus.AVAILABLE,
        pricePerDay: 500,
      },
    });

    // create equipment
    const equipment = await Promise.all(
      demoEquipment.map((item) =>
        tx.equipment.create({
          data: {
            adminId: admin.adminId,
            itemName: item.itemName,
            description: item.description,
            price: item.price,
            quantity: item.quantity,
          },
        })
      )
    );

    // reservation 1 (facility)
    await tx.reservation.create({
      data: {
        userId: user.userId,
        facilityId: facility.facilityId,
        equipmentId: null,
        adminId: null,
        startDateTime: new Date(Date.now() + 86400000),
        endDateTime: new Date(Date.now() + 86400000 * 2),
        purpose: "Community meeting",
        expectedAttendees: 50,
        status: ReservationStatus.PENDING,
      },
    });

    // reservation 2 (equipment)
    await tx.reservation.create({
      data: {
        userId: user.userId,
        facilityId: null,
        equipmentId: equipment[0].equipmentId,
        adminId: admin.adminId,
        startDateTime: new Date(Date.now() + 86400000 * 3),
        endDateTime: new Date(Date.now() + 86400000 * 3 + 2 * 3600000),
        purpose: "Event setup",
        expectedAttendees: 100,
        equipmentQuantity: 2,
        status: ReservationStatus.APPROVED,
        approvedAt: new Date(),
        returnStatus: EquipmentReturnStatus.BORROWED,
      },
    });

    await tx.equipment.update({
      where: { equipmentId: equipment[0].equipmentId },
      data: {
        quantity: {
          decrement: 2,
        },
      },
    });

    return {
      admin,
      user,
      facility,
      equipmentCount: equipment.length,
    };
  });

  console.log("Seeded demo data successfully.");
  console.log(`Admin login: ${demoAdmin.email} / ${demoAdmin.password}`);
  console.log(`User login: ${demoUser.email} / ${demoUser.password}`);
  console.log(
    `Created ${result.equipmentCount} equipment records and facility #${result.facility.facilityId}.`
  );
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
