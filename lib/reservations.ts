type ReservationItemRelations = {
  facilityId: number | null;
  facility: { itemName: string; pricePerDay: number } | null;
  equipment: {
    itemName: string;
    price: unknown;
    quantity?: number | null;
  } | null;
};

type ReservationPeopleRelations = {
  user: {
    name: string;
    email: string;
    contactNumber: string;
  };
  admin?: {
    name: string | null;
  } | null;
};

type ReservationExtras = {
  equipmentQuantity?: number | null;
  adminNotes?: string | null;
  returnStatus?: "BORROWED" | "RETURNED" | null;
  returnedAt?: string | Date | null;
  status?: string | null;
};

export function getReservationItemType(reservation: { facilityId: number | null }) {
  return reservation.facilityId ? "FACILITY" : "EQUIPMENT";
}

export function getReservationItemName(reservation: ReservationItemRelations) {
  return reservation.facilityId
    ? reservation.facility?.itemName ?? ""
    : reservation.equipment?.itemName ?? "";
}

export function getReservationItemPrice(reservation: ReservationItemRelations) {
  return reservation.facilityId
    ? reservation.facility?.pricePerDay ?? 0
    : Number(reservation.equipment?.price ?? 0);
}

export function getReservationAvailableQuantity(reservation: ReservationItemRelations) {
  return reservation.equipment?.quantity ?? null;
}

export function getEquipmentReturnStatus(
  reservation: Pick<ReservationExtras, "returnStatus" | "returnedAt" | "status"> & {
    facilityId: number | null;
  }
) {
  if (reservation.facilityId) {
    return null;
  }

  if (reservation.returnStatus === "RETURNED" || reservation.returnedAt) {
    return "RETURNED";
  }

  if (reservation.returnStatus === "BORROWED") {
    return "BORROWED";
  }

  if (reservation.status === "APPROVED") {
    return "BORROWED";
  }

  return null;
}

export function serializeReservation<
  T extends ReservationItemRelations &
    ReservationPeopleRelations &
    ReservationExtras &
    Record<string, unknown>,
>(reservation: T) {
  return {
    ...reservation,
    itemType: getReservationItemType(reservation),
    itemName: getReservationItemName(reservation),
    itemPrice: getReservationItemPrice(reservation),
    itemQuantity: getReservationAvailableQuantity(reservation),
    equipmentQuantity: reservation.equipmentQuantity ?? null,
    adminNotes: reservation.adminNotes ?? null,
    returnStatus: reservation.returnStatus ?? null,
    returnedAt: reservation.returnedAt ?? null,
    equipmentReturnStatus: getEquipmentReturnStatus(reservation),
    residentName: reservation.user.name,
    residentEmail: reservation.user.email,
    residentContactNumber: reservation.user.contactNumber,
    adminName: reservation.admin?.name ?? null,
  };
}
