-- CreateTable
CREATE TABLE `Admin` (
    `Admin_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(191) NOT NULL,
    `Birthdate` DATE NULL,
    `Gender` VARCHAR(50) NOT NULL,
    `Address` VARCHAR(191) NULL,
    `Username` VARCHAR(191) NOT NULL,
    `Password` VARCHAR(191) NOT NULL,
    `Contact number` VARCHAR(50) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `Role` ENUM('CORE_ADMIN', 'ADMIN') NOT NULL DEFAULT 'ADMIN',
    `Is_Active` BOOLEAN NOT NULL DEFAULT true,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeactivatedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Admin_Username_key`(`Username`),
    PRIMARY KEY (`Admin_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `User_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(191) NOT NULL,
    `Birthdate` DATE NULL,
    `Gender` VARCHAR(50) NOT NULL,
    `Address` VARCHAR(191) NULL,
    `Username` VARCHAR(191) NOT NULL,
    `Password` VARCHAR(191) NOT NULL,
    `Contact number` VARCHAR(50) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `Role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `Is_Active` BOOLEAN NOT NULL DEFAULT true,
    `DeactivatedAt` DATETIME(3) NULL,

    UNIQUE INDEX `User_Username_key`(`Username`),
    PRIMARY KEY (`User_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Equipment` (
    `Equipment_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Admin_ID` INTEGER NOT NULL,
    `Item_Name` VARCHAR(191) NOT NULL,
    `Description` VARCHAR(191) NULL,
    `Price` DECIMAL(65, 30) NULL,
    `Quantity` INTEGER NULL,

    INDEX `Equipment_Admin_ID_idx`(`Admin_ID`),
    PRIMARY KEY (`Equipment_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Facility` (
    `Facility_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Admin_ID` INTEGER NOT NULL,
    `Item Name` VARCHAR(191) NOT NULL,
    `Desciption` VARCHAR(191) NULL,
    `Status` ENUM('AVAILABLE', 'UNDER_MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    `Priceperday` INTEGER NOT NULL,

    INDEX `Facility_Admin_ID_idx`(`Admin_ID`),
    PRIMARY KEY (`Facility_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reservation` (
    `Reservation_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `User_ID` INTEGER NOT NULL,
    `Equipment_ID` INTEGER NULL,
    `Admin_ID` INTEGER NULL,
    `Facility_ID` INTEGER NULL,
    `Start_DateTime` DATETIME(3) NOT NULL,
    `End_DateTime` DATETIME(3) NOT NULL,
    `Purpose` VARCHAR(191) NOT NULL,
    `Status` ENUM('PENDING', 'APPROVED', 'DENIED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `Expected_Attendees` INTEGER NULL,
    `Equipment_Quantity` INTEGER NULL,
    `ApprovedAt` DATETIME(3) NULL,
    `ReturnedAt` DATETIME(3) NULL,
    `CancelledAt` DATETIME(3) NULL,
    `Return_Status` ENUM('BORROWED', 'RETURNED') NULL,
    `Admin_Notes` VARCHAR(191) NULL,

    INDEX `Reservation_User_ID_idx`(`User_ID`),
    INDEX `Reservation_Equipment_ID_idx`(`Equipment_ID`),
    INDEX `Reservation_Admin_ID_idx`(`Admin_ID`),
    INDEX `Reservation_Facility_ID_idx`(`Facility_ID`),
    UNIQUE INDEX `Reservation_User_ID_Facility_ID_Start_DateTime_End_DateTime_key`(`User_ID`, `Facility_ID`, `Start_DateTime`, `End_DateTime`),
    UNIQUE INDEX `Reservation_User_ID_Equipment_ID_Start_DateTime_End_DateTime_key`(`User_ID`, `Equipment_ID`, `Start_DateTime`, `End_DateTime`),
    PRIMARY KEY (`Reservation_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppSession` (
    `Session_ID` VARCHAR(191) NOT NULL,
    `Role` ENUM('USER', 'ADMIN') NOT NULL,
    `Username` VARCHAR(191) NOT NULL,
    `User_ID` INTEGER NULL,
    `Admin_ID` INTEGER NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `LastActivity` DATETIME(3) NOT NULL,
    `ExpiresAt` DATETIME(3) NOT NULL,
    `IP_Address` VARCHAR(191) NULL,
    `User_Agent` VARCHAR(191) NULL,

    INDEX `AppSession_ExpiresAt_idx`(`ExpiresAt`),
    INDEX `AppSession_Username_idx`(`Username`),
    INDEX `AppSession_Role_User_ID_idx`(`Role`, `User_ID`),
    INDEX `AppSession_Role_Admin_ID_idx`(`Role`, `Admin_ID`),
    PRIMARY KEY (`Session_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Equipment` ADD CONSTRAINT `Equipment_Admin_ID_fkey` FOREIGN KEY (`Admin_ID`) REFERENCES `Admin`(`Admin_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Facility` ADD CONSTRAINT `Facility_Admin_ID_fkey` FOREIGN KEY (`Admin_ID`) REFERENCES `Admin`(`Admin_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_User_ID_fkey` FOREIGN KEY (`User_ID`) REFERENCES `User`(`User_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_Equipment_ID_fkey` FOREIGN KEY (`Equipment_ID`) REFERENCES `Equipment`(`Equipment_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_Admin_ID_fkey` FOREIGN KEY (`Admin_ID`) REFERENCES `Admin`(`Admin_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_Facility_ID_fkey` FOREIGN KEY (`Facility_ID`) REFERENCES `Facility`(`Facility_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppSession` ADD CONSTRAINT `AppSession_User_ID_fkey` FOREIGN KEY (`User_ID`) REFERENCES `User`(`User_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppSession` ADD CONSTRAINT `AppSession_Admin_ID_fkey` FOREIGN KEY (`Admin_ID`) REFERENCES `Admin`(`Admin_ID`) ON DELETE CASCADE ON UPDATE CASCADE;
