import { FacilityStatus, ReservationStatus } from "@prisma/client";
import { z } from "zod";
import { ADMIN_ROLE, ADMIN_ROLE_VALUES } from "@/lib/admin-roles";

const optionalNonNegativeNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return typeof value === "string" ? Number(value) : value;
}, z.number().nonnegative().nullable());

const optionalNonNegativeInt = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return typeof value === "string" ? Number(value) : value;
}, z.number().int().nonnegative().nullable());

const optionalPositiveInt = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return typeof value === "string" ? Number(value) : value;
}, z.number().int().positive().nullable());

export const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(4),
  intendedRole: z.enum(["admin", "user"]),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(4),
  contactNumber: z.string().min(7),
  gender: z.string().min(1),
  birthdate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  contactNumber: z.string().min(7),
  gender: z.string().min(1),
  birthdate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  password: z.string().min(4).optional().or(z.literal("")),
});

export const adminCreateSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(4),
  contactNumber: z.string().min(7),
  gender: z.string().min(1),
  birthdate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  adminRole: z.enum(ADMIN_ROLE_VALUES).optional().default(ADMIN_ROLE.ADMIN),
});

export const adminRemovalSchema = z.object({
  adminId: z.coerce.number().int().positive(),
});

export const facilitySchema = z.object({
  itemName: z.string().min(2),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(FacilityStatus),
  pricePerDay: z.coerce.number().int().nonnegative(),
});

export const equipmentSchema = z.object({
  itemName: z.string().min(2),
  description: z.string().optional().nullable(),
  price: optionalNonNegativeNumber,
  quantity: optionalNonNegativeInt,
});

export const reservationSchema = z
  .object({
    userId: z.coerce.number().int().positive(),
    itemType: z.enum(["FACILITY", "EQUIPMENT"]),
    facilityId: z.coerce.number().int().positive().nullable().optional(),
    equipmentId: z.coerce.number().int().positive().nullable().optional(),
    equipmentQuantity: optionalPositiveInt.optional(),
    startDateTime: z.string().min(1),
    endDateTime: z.string().min(1),
    purpose: z.string().min(2),
    expectedAttendees: z.coerce.number().int().positive().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.itemType === "FACILITY" && !data.facilityId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Facility is required",
        path: ["facilityId"],
      });
    }

    if (data.itemType === "EQUIPMENT" && !data.equipmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Equipment is required",
        path: ["equipmentId"],
      });
    }

    if (data.itemType === "EQUIPMENT" && !data.equipmentQuantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Requested quantity is required",
        path: ["equipmentQuantity"],
      });
    }

    if (data.itemType === "FACILITY" && data.equipmentQuantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Requested quantity is only allowed for equipment reservations",
        path: ["equipmentQuantity"],
      });
    }

    if (data.facilityId && data.equipmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose only one reservable item",
        path: ["itemType"],
      });
    }

    const start = new Date(data.startDateTime);
    const end = new Date(data.endDateTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start and end date/time must be valid",
        path: ["startDateTime"],
      });
      return;
    }

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date/time must be after the start date/time",
        path: ["endDateTime"],
      });
    }
  });

export const reservationAdminActionSchema = z
  .object({
    status: z.enum([ReservationStatus.APPROVED, ReservationStatus.DENIED, "RETURNED"]),
    adminNotes: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === ReservationStatus.DENIED && !data.adminNotes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A denial reason is required",
        path: ["adminNotes"],
      });
    }
  });
