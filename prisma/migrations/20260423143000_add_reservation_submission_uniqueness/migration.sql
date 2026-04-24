DELETE duplicate_reservation
FROM `Reservation` AS duplicate_reservation
INNER JOIN `Reservation` AS kept_reservation
    ON duplicate_reservation.`Reservation_ID` > kept_reservation.`Reservation_ID`
   AND duplicate_reservation.`User_ID` = kept_reservation.`User_ID`
   AND duplicate_reservation.`Start_DateTime` = kept_reservation.`Start_DateTime`
   AND duplicate_reservation.`End_DateTime` = kept_reservation.`End_DateTime`
   AND duplicate_reservation.`Facility_ID` <=> kept_reservation.`Facility_ID`
   AND duplicate_reservation.`Equipment_ID` <=> kept_reservation.`Equipment_ID`;

CREATE UNIQUE INDEX `Reservation_User_ID_Facility_ID_Start_DateTime_End_DateTime_key`
    ON `Reservation`(`User_ID`, `Facility_ID`, `Start_DateTime`, `End_DateTime`);

CREATE UNIQUE INDEX `Reservation_User_ID_Equipment_ID_Start_DateTime_End_DateTime_key`
    ON `Reservation`(`User_ID`, `Equipment_ID`, `Start_DateTime`, `End_DateTime`);
