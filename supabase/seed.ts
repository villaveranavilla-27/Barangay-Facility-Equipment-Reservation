import crypto from "node:crypto";
import { createDirectDatabaseClient } from "@/lib/database";
import {
  AdminRole,
  FacilityStatus,
  ReservationStatus,
  Role,
  type EquipmentRecord,
  type FacilityRecord,
  type ReservationRecord,
} from "@/lib/database-types";

const database = createDirectDatabaseClient();

function md5(value: string) {
  return crypto.createHash("md5").update(value).digest("hex");
}

async function ensureAdmin() {
  const existing = await database.admin.findFirst({
    where: { username: "admin" },
    select: { adminId: true },
  });

  const payload = {
    name: "Main Admin",
    birthdate: new Date("1990-01-01"),
    gender: "Male",
    address: "Barangay Hall",
    username: "admin",
    password: md5("admin123"),
    contactNumber: "09123456789",
    email: "admin@example.com",
    role: AdminRole.CORE_ADMIN,
    isActive: true,
    deactivatedAt: null,
  };

  return existing
    ? database.admin.update({
        where: { adminId: existing.adminId },
        data: payload,
      })
    : database.admin.create({
        data: payload,
      });
}

async function ensureUser() {
  const existing = await database.user.findFirst({
    where: { username: "user1" },
    select: { userId: true },
  });

  const payload = {
    name: "User One",
    birthdate: new Date("2001-01-01"),
    gender: "Female",
    address: "Barangay 1",
    username: "user1",
    password: md5("user123"),
    contactNumber: "09999999999",
    email: "user1@example.com",
    role: Role.USER,
    isActive: true,
    deactivatedAt: null,
  };

  return existing
    ? database.user.update({
        where: { userId: existing.userId },
        data: payload,
      })
    : database.user.create({
        data: payload,
      });
}

async function ensureEquipment(adminId: number) {
  const equipmentItems = [
    {
      itemName: "Foldable Chair",
      description: "Plastic foldable chair for meetings and events",
      price: "25.00",
      quantity: 100,
    },
    {
      itemName: "Event Tent",
      description: "10x10 ft outdoor event tent with basic setup",
      price: "1500.00",
      quantity: 6,
    },
    {
      itemName: "Wired Microphone",
      description: "Standard wired microphone for programs and announcements",
      price: "300.00",
      quantity: 10,
    },
    {
      itemName: "Sound System",
      description: "Basic PA sound system set with mixer and amplifier",
      price: "2500.00",
      quantity: 3,
    },
    {
      itemName: "Folding Table",
      description: "6 ft rectangular folding table for events and meetings",
      price: "150.00",
      quantity: 30,
    },
    {
      itemName: "Projector",
      description: "HD projector for presentations and community programs",
      price: "1200.00",
      quantity: 3,
    },
    {
      itemName: "Portable Speaker",
      description: "Rechargeable portable speaker for small gatherings",
      price: "700.00",
      quantity: 8,
    },
  ] as const;

  const savedEquipment: EquipmentRecord[] = [];

  for (const item of equipmentItems) {
    const existing = await database.equipment.findFirst({
      where: {
        itemName: item.itemName,
        adminId,
      },
    });

    if (existing) {
      savedEquipment.push(
        (await database.equipment.update({
          where: { equipmentId: existing.equipmentId },
          data: {
            description: item.description,
            price: item.price,
            quantity: item.quantity,
          },
        })) as EquipmentRecord
      );
    } else {
      savedEquipment.push(
        (await database.equipment.create({
          data: {
            adminId,
            itemName: item.itemName,
            description: item.description,
            price: item.price,
            quantity: item.quantity,
          },
        })) as EquipmentRecord
      );
    }
  }

  return savedEquipment;
}

async function ensureFacility(adminId: number) {
  const existing = await database.facility.findFirst({
    where: {
      itemName: "Covered Court",
      adminId,
    },
  });

  const payload = {
    description: "Community covered court",
    status: FacilityStatus.AVAILABLE,
    pricePerDay: 500,
  };

  return existing
    ? ((await database.facility.update({
        where: { facilityId: existing.facilityId },
        data: payload,
      })) as FacilityRecord)
    : ((await database.facility.create({
        data: {
          adminId,
          itemName: "Covered Court",
          ...payload,
        },
      })) as FacilityRecord);
}

async function ensureEquipmentReservation(
  userId: number,
  adminId: number,
  equipmentId: number
) {
  const startDateTime = new Date("2026-05-01T08:00:00.000Z");
  const endDateTime = new Date("2026-05-01T12:00:00.000Z");

  const existing = await database.reservation.findFirst({
    where: {
      userId,
      equipmentId,
      startDateTime,
      endDateTime,
    },
  });

  const payload = {
    adminId,
    facilityId: null,
    purpose: "Barangay meeting equipment use",
    status: ReservationStatus.PENDING,
    expectedAttendees: null,
    equipmentQuantity: 10,
    approvedAt: null,
    returnedAt: null,
    cancelledAt: null,
    returnStatus: null,
    adminNotes: null,
  };

  return existing
    ? ((await database.reservation.update({
        where: { reservationId: existing.reservationId },
        data: payload,
      })) as ReservationRecord)
    : ((await database.reservation.create({
        data: {
          userId,
          equipmentId,
          adminId,
          facilityId: null,
          startDateTime,
          endDateTime,
          purpose: payload.purpose,
          status: payload.status,
          expectedAttendees: payload.expectedAttendees,
          equipmentQuantity: payload.equipmentQuantity,
          approvedAt: payload.approvedAt,
          returnedAt: payload.returnedAt,
          cancelledAt: payload.cancelledAt,
          returnStatus: payload.returnStatus,
          adminNotes: payload.adminNotes,
        },
      })) as ReservationRecord);
}

async function ensureFacilityReservation(
  userId: number,
  adminId: number,
  facilityId: number
) {
  const startDateTime = new Date("2026-05-02T08:00:00.000Z");
  const endDateTime = new Date("2026-05-02T17:00:00.000Z");

  const existing = await database.reservation.findFirst({
    where: {
      userId,
      facilityId,
      startDateTime,
      endDateTime,
    },
  });

  const payload = {
    adminId,
    equipmentId: null,
    purpose: "Barangay event reservation",
    status: ReservationStatus.PENDING,
    expectedAttendees: 100,
    equipmentQuantity: null,
    approvedAt: null,
    returnedAt: null,
    cancelledAt: null,
    returnStatus: null,
    adminNotes: null,
  };

  return existing
    ? ((await database.reservation.update({
        where: { reservationId: existing.reservationId },
        data: payload,
      })) as ReservationRecord)
    : ((await database.reservation.create({
        data: {
          userId,
          equipmentId: null,
          adminId,
          facilityId,
          startDateTime,
          endDateTime,
          purpose: payload.purpose,
          status: payload.status,
          expectedAttendees: payload.expectedAttendees,
          equipmentQuantity: payload.equipmentQuantity,
          approvedAt: payload.approvedAt,
          returnedAt: payload.returnedAt,
          cancelledAt: payload.cancelledAt,
          returnStatus: payload.returnStatus,
          adminNotes: payload.adminNotes,
        },
      })) as ReservationRecord);
}

async function main() {
  console.log("Supabase seed started...");

  const admin = await ensureAdmin();
  const user = await ensureUser();
  const equipment = await ensureEquipment(admin.adminId);
  const facility = await ensureFacility(admin.adminId);

  await ensureEquipmentReservation(user.userId, admin.adminId, equipment[0].equipmentId);
  await ensureFacilityReservation(user.userId, admin.adminId, facility.facilityId);

  console.log("Supabase seed finished successfully.");
}

main()
  .catch((error) => {
    console.error("Supabase seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await database.$disconnect();
  });
