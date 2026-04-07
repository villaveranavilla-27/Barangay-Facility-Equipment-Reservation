CREATE TABLE `admin` (
  `admin_ID` INT NOT NULL AUTO_INCREMENT,
  `Name` VARCHAR(50) NOT NULL,
  `Birthdate` DATE NULL,
  `Gender` VARCHAR(50) NOT NULL,
  `Address` VARCHAR(50) NOT NULL,
  `User name` VARCHAR(50) NOT NULL,
  `Password` VARCHAR(50) NOT NULL,
  `Contact_Info` INT NOT NULL,
  `Email` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`admin_ID`),
  UNIQUE INDEX `admin_User name_key`(`User name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `equipment` (
  `Equipment_ID` INT NOT NULL AUTO_INCREMENT,
  `Item_name` VARCHAR(191) NOT NULL,
  `Description` VARCHAR(191) NULL,
  `Category` VARCHAR(191) NULL,
  `quantity` INT NOT NULL,
  `price` DOUBLE NOT NULL,
  PRIMARY KEY (`Equipment_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `facility` (
  `Facility_id` INT NOT NULL AUTO_INCREMENT,
  `Item_name` VARCHAR(191) NOT NULL,
  `Description` VARCHAR(191) NULL,
  `Status` ENUM('AVAILABLE', 'UNDER_MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
  `Priceperday` INT NOT NULL,
  PRIMARY KEY (`Facility_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user` (
  `User_ID` INT NOT NULL AUTO_INCREMENT,
  `Full Name` VARCHAR(191) NOT NULL,
  `Birthdate` DATE NULL,
  `Gender` VARCHAR(191) NOT NULL,
  `Address` VARCHAR(191) NULL,
  `Username` VARCHAR(191) NOT NULL,
  `Password` VARCHAR(191) NOT NULL,
  `Contact_Info` INT NOT NULL,
  `Email` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`User_ID`),
  UNIQUE INDEX `user_Username_key`(`Username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `reservation` (
  `Reservation_id` INT NOT NULL AUTO_INCREMENT,
  `User_ID` INT NOT NULL,
  `Item Type` ENUM('FACILITY', 'EQUIPMENT') NOT NULL,
  `Facility_ID` INT NULL,
  `Equipment_ID` INT NULL,
  `StartDateTime` DATETIME(3) NOT NULL,
  `EndDateTime` DATETIME(3) NOT NULL,
  `Purpose` VARCHAR(191) NOT NULL,
  `Expected Attendees` INT NULL,
  `Status` ENUM('PENDING', 'APPROVED', 'DENIED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `ApprovedAt` DATETIME(3) NULL,
  PRIMARY KEY (`Reservation_id`),
  INDEX `Reservation_userId_fkey`(`User_ID`),
  INDEX `Reservation_facilityId_fkey`(`Facility_ID`),
  INDEX `Reservation_equipmentId_fkey`(`Equipment_ID`),
  CONSTRAINT `reservation_User_ID_fkey` FOREIGN KEY (`User_ID`) REFERENCES `user`(`User_ID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `reservation_Facility_ID_fkey` FOREIGN KEY (`Facility_ID`) REFERENCES `facility`(`Facility_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reservation_Equipment_ID_fkey` FOREIGN KEY (`Equipment_ID`) REFERENCES `equipment`(`Equipment_ID`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
