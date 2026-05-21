export const FacilityStatus = {
  AVAILABLE: "AVAILABLE",
  UNDER_MAINTENANCE: "UNDER_MAINTENANCE",
} as const;

export const ReservationStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  DENIED: "DENIED",
  CANCELLED: "CANCELLED",
} as const;

export const EquipmentReturnStatus = {
  BORROWED: "BORROWED",
  RETURNED: "RETURNED",
} as const;

export const Role = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export const AdminRole = {
  CORE_ADMIN: "CORE_ADMIN",
  ADMIN: "ADMIN",
} as const;

export type FacilityStatusValue =
  (typeof FacilityStatus)[keyof typeof FacilityStatus];
export type ReservationStatusValue =
  (typeof ReservationStatus)[keyof typeof ReservationStatus];
export type EquipmentReturnStatusValue =
  (typeof EquipmentReturnStatus)[keyof typeof EquipmentReturnStatus];
export type RoleValue = (typeof Role)[keyof typeof Role];
export type AdminRoleValue = (typeof AdminRole)[keyof typeof AdminRole];

export type AdminRecord = {
  adminId: number;
  name: string;
  birthdate: Date | null;
  gender: string;
  address: string | null;
  username: string;
  password: string;
  contactNumber: string;
  email: string;
  role: AdminRoleValue;
  isActive: boolean;
  createdAt: Date;
  deactivatedAt: Date | null;
};

export type UserRecord = {
  userId: number;
  name: string;
  birthdate: Date | null;
  gender: string;
  address: string | null;
  username: string;
  password: string;
  contactNumber: string;
  email: string;
  role: RoleValue;
  isActive: boolean;
  deactivatedAt: Date | null;
};

export type EquipmentRecord = {
  equipmentId: number;
  adminId: number;
  itemName: string;
  description: string | null;
  price: string | null;
  quantity: number | null;
};

export type FacilityRecord = {
  facilityId: number;
  adminId: number;
  itemName: string;
  description: string | null;
  status: FacilityStatusValue;
  pricePerDay: number;
};

export type ReservationRecord = {
  reservationId: number;
  userId: number;
  equipmentId: number | null;
  adminId: number | null;
  facilityId: number | null;
  startDateTime: Date;
  endDateTime: Date;
  purpose: string;
  status: ReservationStatusValue;
  expectedAttendees: number | null;
  equipmentQuantity: number | null;
  approvedAt: Date | null;
  returnedAt: Date | null;
  cancelledAt: Date | null;
  returnStatus: EquipmentReturnStatusValue | null;
  adminNotes: string | null;
};

export type AppSessionRecord = {
  sessionId: string;
  role: RoleValue;
  username: string;
  userId: number | null;
  adminId: number | null;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

export type ReservationWithRelations = ReservationRecord & {
  user: UserRecord;
  facility: FacilityRecord | null;
  equipment: EquipmentRecord | null;
  admin: AdminRecord | null;
};

export type SelectShape<T extends Record<string, unknown>> = Partial<
  Record<keyof T, boolean>
>;

export class DatabaseClientKnownRequestError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "DatabaseClientKnownRequestError";
    this.code = code;
  }
}

export const UNIQUE_CONSTRAINT_ERROR_CODE = "P2002";
