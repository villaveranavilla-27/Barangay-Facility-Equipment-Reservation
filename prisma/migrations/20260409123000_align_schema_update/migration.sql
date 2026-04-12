-- AlterTable
ALTER TABLE `Equipment`
    ADD COLUMN `Price` DECIMAL(65, 30) NULL,
    ADD COLUMN `Quantity` INTEGER NULL;

-- AlterTable
ALTER TABLE `Facility`
    ADD COLUMN `Admin_ID` INTEGER NULL;

UPDATE `Facility`
SET `Admin_ID` = (
    SELECT `Admin_ID`
    FROM `Admin`
    ORDER BY `Admin_ID` ASC
    LIMIT 1
)
WHERE `Admin_ID` IS NULL;

ALTER TABLE `Facility`
    MODIFY `Admin_ID` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Reservation`
    ADD COLUMN `End_DateTime` DATETIME(3) NULL,
    ADD COLUMN `Start_DateTime` DATETIME(3) NULL;

UPDATE `Reservation`
SET
    `Start_DateTime` = `Start_Date`,
    `End_DateTime` = `End_Date`
WHERE `Start_DateTime` IS NULL
   OR `End_DateTime` IS NULL;

ALTER TABLE `Reservation`
    MODIFY `End_DateTime` DATETIME(3) NOT NULL,
    MODIFY `Start_DateTime` DATETIME(3) NOT NULL,
    DROP COLUMN `End_Date`,
    DROP COLUMN `Start_Date`;

-- CreateIndex
CREATE INDEX `Facility_Admin_ID_idx` ON `Facility`(`Admin_ID`);

-- AddForeignKey
ALTER TABLE `Facility`
    ADD CONSTRAINT `Facility_Admin_ID_fkey`
    FOREIGN KEY (`Admin_ID`) REFERENCES `Admin`(`Admin_ID`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
