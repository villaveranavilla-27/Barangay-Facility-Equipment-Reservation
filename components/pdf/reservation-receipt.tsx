import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { money } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11, fontFamily: "Helvetica", color: "#1F2937" },
  header: { marginBottom: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#D1D5DB" },
  title: { fontSize: 20, fontWeight: "bold", color: "#16A34A" },
  row: { flexDirection: "row", marginBottom: 6 },
  label: { width: "35%", color: "#6B7280" },
  value: { width: "65%" },
  badge: { marginTop: 10, padding: 8, backgroundColor: "#ECFDF5", color: "#15803D" }
});

export function ReservationReceiptDoc({
  reservation
}: {
  reservation: {
    reservationId: number;
    name: string;
    email: string;
    contactNumber: string;
    itemName: string;
    itemType: string;
    startDateTime: string;
    endDateTime: string;
    purpose: string;
    status: string;
    itemPrice: number;
    expectedAttendees?: number | null;
    equipmentQuantity?: number | null;
    approvedAt?: string | null;
  };
}) {
  return (
    <Document title={`Reservation-${reservation.reservationId}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Approved Reservation Receipt</Text>
          <Text>Barangay Facility and Equipment Management System</Text>
        </View>

        <View style={styles.row}><Text style={styles.label}>Reservation ID</Text><Text style={styles.value}>{reservation.reservationId}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Resident Name</Text><Text style={styles.value}>{reservation.name}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Email</Text><Text style={styles.value}>{reservation.email}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Contact Number</Text><Text style={styles.value}>{reservation.contactNumber}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Item</Text><Text style={styles.value}>{reservation.itemName} ({reservation.itemType})</Text></View>
        <View style={styles.row}><Text style={styles.label}>Date and Time</Text><Text style={styles.value}>{reservation.startDateTime} - {reservation.endDateTime}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Purpose</Text><Text style={styles.value}>{reservation.purpose}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Price</Text><Text style={styles.value}>{money(reservation.itemPrice)}</Text></View>
        {reservation.itemType === "FACILITY" ? (
          <View style={styles.row}><Text style={styles.label}>Expected Attendees</Text><Text style={styles.value}>{reservation.expectedAttendees ?? "N/A"}</Text></View>
        ) : null}
        {reservation.itemType === "EQUIPMENT" ? (
          <View style={styles.row}><Text style={styles.label}>Requested Quantity</Text><Text style={styles.value}>{reservation.equipmentQuantity ?? "N/A"}</Text></View>
        ) : null}
        <View style={styles.row}><Text style={styles.label}>Status</Text><Text style={styles.value}>{reservation.status}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Approved At</Text><Text style={styles.value}>{reservation.approvedAt || "N/A"}</Text></View>

        <View style={styles.badge}>
          <Text>This receipt confirms the reservation has been approved.</Text>
        </View>
      </Page>
    </Document>
  );
}
