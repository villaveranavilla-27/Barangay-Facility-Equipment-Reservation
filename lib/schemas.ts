import { FacilityStatus, ReservationStatus } from "@prisma/client";
import { z } from "zod";
import { ADMIN_ROLE, ADMIN_ROLE_VALUES } from "@/lib/admin-roles";

const personNamePattern = /^[A-Za-z][A-Za-z\s.'-]*$/;
const usernamePattern = /^[A-Za-z0-9_]+$/;
const contactNumberPattern = /^\d{7,15}$/;
const addressPattern = /^[A-Za-z0-9\s.,#'/-]*$/;
const catalogNamePattern = /^[A-Za-z0-9][A-Za-z0-9\s.,'()&/-]*$/;

function isValidDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function normalizeOptionalString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

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

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(191, "Name is too long")
  .regex(personNamePattern, "Name contains invalid characters");

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(191, "Username is too long")
  .regex(
    usernamePattern,
    "Username may only contain letters, numbers, and underscores"
  );

const emailSchema = z
  .string()
  .trim()
  .max(191, "Email is too long")
  .email("Email must be valid");

const passwordSchema = z
  .string()
  .min(4, "Password must be at least 4 characters")
  .max(191, "Password is too long");

const contactNumberSchema = z
  .string()
  .trim()
  .regex(contactNumberPattern, "Contact number must contain 7 to 15 digits");

const genderSchema = z.enum(["Male", "Female", "Other", "Prefer not to say"]);

const optionalBirthdateSchema = z.preprocess(
  normalizeOptionalString,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Birthdate must use YYYY-MM-DD format")
    .refine(isValidDateOnly, "Birthdate must be a valid calendar date")
    .refine(
      (value) => new Date(`${value}T00:00:00.000Z`) <= new Date(),
      "Birthdate cannot be in the future"
    )
    .nullable()
);

const optionalAddressSchema = z.preprocess(
  normalizeOptionalString,
  z
    .string()
    .max(191, "Address is too long")
    .regex(addressPattern, "Address contains invalid characters")
    .nullable()
);

const optionalDescriptionSchema = z.preprocess(
  normalizeOptionalString,
  z.string().max(191, "Description is too long").nullable()
);

const catalogNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(191, "Name is too long")
  .regex(catalogNamePattern, "Name contains invalid characters");

export const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: passwordSchema,
  intendedRole: z.enum(["admin", "user"]),
});

export const registerSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  contactNumber: contactNumberSchema,
  gender: genderSchema,
  birthdate: optionalBirthdateSchema,
  address: optionalAddressSchema,
});

export const userUpdateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  contactNumber: contactNumberSchema,
  gender: genderSchema,
  birthdate: optionalBirthdateSchema,
  address: optionalAddressSchema,
  password: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    },
    passwordSchema.optional()
  ),
});

export const adminCreateSchema = z.object({
  userId: z.coerce.number().int().positive(),
  adminRole: z.enum(ADMIN_ROLE_VALUES).optional().default(ADMIN_ROLE.ADMIN),
});

export const adminRemovalSchema = z.object({
  adminId: z.coerce.number().int().positive(),
});

export const userAccountStatusSchema = z.object({
  userId: z.coerce.number().int().positive(),
  isActive: z.boolean(),
});

export const facilitySchema = z.object({
  itemName: catalogNameSchema,
  description: optionalDescriptionSchema,
  status: z.nativeEnum(FacilityStatus),
  pricePerDay: z.coerce.number().int().nonnegative(),
});

export const equipmentSchema = z.object({
  itemName: catalogNameSchema,
  description: optionalDescriptionSchema,
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
