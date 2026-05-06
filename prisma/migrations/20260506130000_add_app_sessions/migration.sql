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
ALTER TABLE `AppSession` ADD CONSTRAINT `AppSession_User_ID_fkey` FOREIGN KEY (`User_ID`) REFERENCES `User`(`User_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppSession` ADD CONSTRAINT `AppSession_Admin_ID_fkey` FOREIGN KEY (`Admin_ID`) REFERENCES `Admin`(`Admin_ID`) ON DELETE CASCADE ON UPDATE CASCADE;
