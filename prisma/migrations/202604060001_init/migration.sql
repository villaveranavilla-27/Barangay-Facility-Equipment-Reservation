CREATE TABLE `Admin` (
  `Admin_ID` INT NOT NULL AUTO_INCREMENT,
  `Name` VARCHAR(191) NOT NULL,
  `Birthdate` DATE NULL,
  `Gender` VARCHAR(50) NOT NULL,
  `Address` VARCHAR(191) NULL,
  `Username` VARCHAR(191) NOT NULL,
  `Password` VARCHAR(191) NOT NULL,
  `Contact number` VARCHAR(50) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`Admin_ID`),
  UNIQUE INDEX `Admin_Username_key`(`Username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `User` (
  `User_ID` INT NOT NULL AUTO_INCREMENT,
  `Name` VARCHAR(191) NOT NULL,
  `Birthdate` DATE NULL,
  `Gender` VARCHAR(50) NOT NULL,
  `Address` VARCHAR(191) NULL,
  `Username` VARCHAR(191) NOT NULL,
  `Password` VARCHAR(191) NOT NULL,
  `Contact number` VARCHAR(50) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`User_ID`),
  UNIQUE INDEX `User_Username_key`(`Username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Equipment` (
  `Equipment_ID` INT NOT NULL AUTO_INCREMENT,
  `Admin_ID` INT NOT NULL,
  `Item_Name` VARCHAR(191) NOT NULL,
  `Description` VARCHAR(191) NULL,
  `Category` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`Equipment_ID`),
  INDEX `Equipment_Admin_ID_fkey`(`Admin_ID`),
  CONSTRAINT `Equipment_Admin_ID_fkey` FOREIGN KEY (`Admin_ID`) REFERENCES `Admin`(`Admin_ID`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Facility` (
  `Facility_ID` INT NOT NULL AUTO_INCREMENT,
  `Item Name` VARCHAR(191) NOT NULL,
  `Desciption` VARCHAR(191) NULL,
  `Status` ENUM('AVAILABLE', 'UNDER_MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
  `Priceperday` INT NOT NULL,
  PRIMARY KEY (`Facility_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Reservation` (
  `Reservation_ID` INT NOT NULL AUTO_INCREMENT,
  `User_ID` INT NOT NULL,
  `Equipment_ID` INT NULL,
  `Admin_ID` INT NULL,
  `Facility_ID` INT NULL,
  `Start_Date` DATETIME(3) NOT NULL,
  `End_Date` DATETIME(3) NOT NULL,
  `Purpose` VARCHAR(191) NOT NULL,
  `Status` ENUM('PENDING', 'APPROVED', 'DENIED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `Expected_Attendees` INT NULL,
  `ApprovedAt` DATETIME(3) NULL,
  PRIMARY KEY (`Reservation_ID`),
  INDEX `Reservation_User_ID_fkey`(`User_ID`),
  INDEX `Reservation_Equipment_ID_fkey`(`Equipment_ID`),
  INDEX `Reservation_Admin_ID_fkey`(`Admin_ID`),
  INDEX `Reservation_Facility_ID_fkey`(`Facility_ID`),
  CONSTRAINT `Reservation_User_ID_fkey` FOREIGN KEY (`User_ID`) REFERENCES `User`(`User_ID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Reservation_Equipment_ID_fkey` FOREIGN KEY (`Equipment_ID`) REFERENCES `Equipment`(`Equipment_ID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Reservation_Admin_ID_fkey` FOREIGN KEY (`Admin_ID`) REFERENCES `Admin`(`Admin_ID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Reservation_Facility_ID_fkey` FOREIGN KEY (`Facility_ID`) REFERENCES `Facility`(`Facility_ID`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
