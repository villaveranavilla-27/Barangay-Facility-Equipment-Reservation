import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(4),
  role: z.enum(["USER", "ADMIN"])
});

export const registerSchema = z.object({
  fullName: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(4),
  contactInfo: z.coerce.number().int(),
  gender: z.string().min(1),
  birthdate: z.string().optional().nullable(),
  address: z.string().optional().nullable()
});

export const userUpdateSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  contactInfo: z.coerce.number().int(),
  gender: z.string().min(1),
  birthdate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  password: z.string().min(4).optional().or(z.literal(""))
});

export const adminCreateSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(4),
  contactInfo: z.coerce.number().int(),
  gender: z.string().min(1),
  birthdate: z.string().optional().nullable(),
  address: z.string().optional().nullable()
});

export const facilitySchema = z.object({
  itemName: z.string().min(2),
  description: z.string().optional().nullable(),
  status: z.enum(["AVAILABLE", "UNDER_MAINTENANCE"]).default("AVAILABLE"),
  pricePerDay: z.coerce.number().int()
});

export const equipmentSchema = z.object({
  itemName: z.string().min(2),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(0),
  price: z.coerce.number().min(0)
});

export const reservationSchema = z.object({
  userId: z.coerce.number().int().optional(),
  itemType: z.enum(["FACILITY", "EQUIPMENT"]),
  facilityId: z.coerce.number().int().optional().nullable(),
  equipmentId: z.coerce.number().int().optional().nullable(),
  startDateTime: z.string().min(1),
  endDateTime: z.string().min(1),
  purpose: z.string().min(3),
  expectedAttendees: z.coerce.number().int().optional().nullable()
}).refine((data) => data.itemType === "FACILITY" ? !!data.facilityId : !!data.equipmentId, {
  message: "Select an item"
});

export const reservationDecisionSchema = z.object({
  status: z.enum(["APPROVED", "DENIED"]),
  adminNotes: z.string().optional().nullable()
});

export const reportRangeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1)
});
