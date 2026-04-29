-- AlterTable
ALTER TABLE `User`
    ADD COLUMN `Is_Active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `DeactivatedAt` DATETIME(3) NULL;
