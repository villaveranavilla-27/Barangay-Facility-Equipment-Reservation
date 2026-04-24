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
  cancelledAt?: string | Date | null;
  status?: string | null;
};

type ReservationCancellationState = Pick<
  ReservationExtras,
  "returnStatus" | "returnedAt" | "status"
> & {
  startDateTime: string | Date;
  endDateTime: string | Date;
};

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

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

export function getReservationCancellationErrorMessage(
  reservation: ReservationCancellationState,
  now = new Date()
) {
  if (reservation.status === "CANCELLED") {
    return "This reservation was already cancelled.";
  }

  if (reservation.status === "DENIED") {
    return "Denied reservations cannot be cancelled.";
  }

  if (reservation.status === "APPROVED") {
    return "Approved reservations cannot be cancelled.";
  }

  if (reservation.returnStatus === "RETURNED" || reservation.returnedAt) {
    return "Returned reservations cannot be cancelled.";
  }

  if (reservation.status !== "PENDING") {
    return "Only pending reservations can be cancelled.";
  }

  const startDateTime = toDate(reservation.startDateTime);
  const endDateTime = toDate(reservation.endDateTime);

  if (
    Number.isNaN(startDateTime.getTime()) ||
    Number.isNaN(endDateTime.getTime())
  ) {
    return "This reservation can no longer be cancelled.";
  }

  if (endDateTime <= now) {
    return "Completed or expired reservations can no longer be cancelled.";
  }

  if (startDateTime <= now) {
    return "Ongoing reservations can no longer be cancelled.";
  }

  return null;
}

export function canCancelReservation(
  reservation: ReservationCancellationState,
  now = new Date()
) {
  return getReservationCancellationErrorMessage(reservation, now) === null;
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
    cancelledAt: reservation.cancelledAt ?? null,
    equipmentReturnStatus: getEquipmentReturnStatus(reservation),
    residentName: reservation.user.name,
    residentEmail: reservation.user.email,
    residentContactNumber: reservation.user.contactNumber,
    adminName: reservation.admin?.name ?? null,
  };
}
