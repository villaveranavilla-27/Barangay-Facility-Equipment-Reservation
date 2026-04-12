-- RedefineIndex
CREATE INDEX `Equipment_Admin_ID_idx` ON `Equipment`(`Admin_ID`);
DROP INDEX `Equipment_Admin_ID_fkey` ON `equipment`;

-- RedefineIndex
CREATE INDEX `Reservation_Admin_ID_idx` ON `Reservation`(`Admin_ID`);
DROP INDEX `Reservation_Admin_ID_fkey` ON `reservation`;

-- RedefineIndex
CREATE INDEX `Reservation_Equipment_ID_idx` ON `Reservation`(`Equipment_ID`);
DROP INDEX `Reservation_Equipment_ID_fkey` ON `reservation`;

-- RedefineIndex
CREATE INDEX `Reservation_Facility_ID_idx` ON `Reservation`(`Facility_ID`);
DROP INDEX `Reservation_Facility_ID_fkey` ON `reservation`;

-- RedefineIndex
CREATE INDEX `Reservation_User_ID_idx` ON `Reservation`(`User_ID`);
DROP INDEX `Reservation_User_ID_fkey` ON `reservation`;
