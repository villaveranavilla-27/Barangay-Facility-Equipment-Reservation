import { PrismaClient, FacilityStatus, ReservationItemType, ReservationStatus } from "@prisma/client";
import { md5 } from "../lib/utils";

const prisma = new PrismaClient();

async function main() {
  await prisma.reservation.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.admin.create({
    data: {
      name: "Barangay Secretary",
      birthdate: new Date("1990-01-01"),
      gender: "Female",
      address: "Barangay Hall",
      username: "admin",
      password: md5("admin123"),
      contactInfo: 912345678,
      email: "admin@example.com"
    }
  });

  const user = await prisma.user.create({
    data: {
      fullName: "Juan Dela Cruz",
      birthdate: new Date("1998-03-14"),
      gender: "Male",
      address: "Purok 1",
      username: "user",
      password: md5("user123"),
      contactInfo: 917000000,
      email: "user@example.com"
    }
  });

  const facilities = await prisma.facility.create({
    data: {
      itemName: "Barangay Covered Court Complex",
      description: "Roofed venue with stage, lights, and basic facilities.",
      status: FacilityStatus.AVAILABLE,
      pricePerDay: 500
    }
  });

  const equipment = await prisma.equipment.createMany({
    data: [
      { itemName: "Chairs", description: "Stackable plastic chair.", category: "Furniture", quantity: 100, price: 30 },
      { itemName: "Microphone", description: "Wireless handheld microphone.", category: "Audio", quantity: 5, price: 150 },
      { itemName: "Sound System", description: "Complete sound system with wireless microphones.", category: "Audio", quantity: 2, price: 2500 },
      { itemName: "Speaker", description: "Portable Bluetooth speaker.", category: "Audio", quantity: 2, price: 200 },
      { itemName: "Projector", description: "HD Projector with screen.", category: "AV", quantity: 2, price: 250 },
      { itemName: "Tables", description: "Foldable banquet tables.", category: "Furniture", quantity: 10, price: 80 },
      { itemName: "Tent", description: "Tent with frame and setup.", category: "Outdoor", quantity: 5, price: 200 }
    ]
  });

  const eqs = await prisma.equipment.findMany();

  await prisma.reservation.createMany({
    data: [
      {
        userId: user.userId,
        itemType: ReservationItemType.FACILITY,
        facilityId: facilities.facilityId,
        equipmentId: null,
        startDateTime: new Date(Date.now() + 86400000),
        endDateTime: new Date(Date.now() + 86400000 * 2),
        purpose: "Community meeting",
        expectedAttendees: 50,
        status: ReservationStatus.PENDING
      },
      {
        userId: user.userId,
        itemType: ReservationItemType.EQUIPMENT,
        facilityId: null,
        equipmentId: eqs[0].equipmentId,
        startDateTime: new Date(Date.now() + 86400000 * 3),
        endDateTime: new Date(Date.now() + 86400000 * 3 + 2 * 3600000),
        purpose: "Event setup",
        expectedAttendees: 100,
        status: ReservationStatus.APPROVED,
        approvedAt: new Date()
      }
    ]
  });

  console.log("Seeded demo data");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
