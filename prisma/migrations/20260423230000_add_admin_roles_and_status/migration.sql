ALTER TABLE `Admin`
    ADD COLUMN `Role` ENUM('CORE_ADMIN', 'ADMIN') NOT NULL DEFAULT 'ADMIN',
    ADD COLUMN `Is_Active` BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `DeactivatedAt` DATETIME(3) NULL;

UPDATE `Admin`
SET `Role` = 'CORE_ADMIN'
WHERE `Admin_ID` = (
    SELECT `Admin_ID`
    FROM (
        SELECT `Admin_ID`
        FROM `Admin`
        ORDER BY `Admin_ID` ASC
        LIMIT 1
    ) AS core_admin
);
