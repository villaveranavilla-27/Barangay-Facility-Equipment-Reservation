-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "FacilityStatus" AS ENUM ('AVAILABLE', 'UNDER_MAINTENANCE');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EquipmentReturnStatus" AS ENUM ('BORROWED', 'RETURNED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('CORE_ADMIN', 'ADMIN');

-- CreateTable
CREATE TABLE "Admin" (
    "Admin_ID" SERIAL NOT NULL,
    "Name" VARCHAR(191) NOT NULL,
    "Birthdate" DATE,
    "Gender" VARCHAR(50) NOT NULL,
    "Address" VARCHAR(191),
    "Username" VARCHAR(191) NOT NULL,
    "Password" VARCHAR(191) NOT NULL,
    "Contact number" VARCHAR(50) NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "Role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "Is_Active" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "DeactivatedAt" TIMESTAMP(3),

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("Admin_ID")
);

-- CreateTable
CREATE TABLE "User" (
    "User_ID" SERIAL NOT NULL,
    "Name" VARCHAR(191) NOT NULL,
    "Birthdate" DATE,
    "Gender" VARCHAR(50) NOT NULL,
    "Address" VARCHAR(191),
    "Username" VARCHAR(191) NOT NULL,
    "Password" VARCHAR(191) NOT NULL,
    "Contact number" VARCHAR(50) NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "Role" "Role" NOT NULL DEFAULT 'USER',
    "Is_Active" BOOLEAN NOT NULL DEFAULT true,
    "DeactivatedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("User_ID")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "Equipment_ID" SERIAL NOT NULL,
    "Admin_ID" INTEGER NOT NULL,
    "Item_Name" VARCHAR(191) NOT NULL,
    "Description" VARCHAR(191),
    "Price" DECIMAL(65,30),
    "Quantity" INTEGER,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("Equipment_ID")
);

-- CreateTable
CREATE TABLE "Facility" (
    "Facility_ID" SERIAL NOT NULL,
    "Admin_ID" INTEGER NOT NULL,
    "Item Name" VARCHAR(191) NOT NULL,
    "Desciption" VARCHAR(191),
    "Status" "FacilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "Priceperday" INTEGER NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("Facility_ID")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "Reservation_ID" SERIAL NOT NULL,
    "User_ID" INTEGER NOT NULL,
    "Equipment_ID" INTEGER,
    "Admin_ID" INTEGER,
    "Facility_ID" INTEGER,
    "Start_DateTime" TIMESTAMP(3) NOT NULL,
    "End_DateTime" TIMESTAMP(3) NOT NULL,
    "Purpose" VARCHAR(191) NOT NULL,
    "Status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "Expected_Attendees" INTEGER,
    "Equipment_Quantity" INTEGER,
    "ApprovedAt" TIMESTAMP(3),
    "ReturnedAt" TIMESTAMP(3),
    "CancelledAt" TIMESTAMP(3),
    "Return_Status" "EquipmentReturnStatus",
    "Admin_Notes" VARCHAR(191),

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("Reservation_ID")
);

-- CreateTable
CREATE TABLE "AppSession" (
    "Session_ID" VARCHAR(191) NOT NULL,
    "Role" "Role" NOT NULL,
    "Username" VARCHAR(191) NOT NULL,
    "User_ID" INTEGER,
    "Admin_ID" INTEGER,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastActivity" TIMESTAMP(3) NOT NULL,
    "ExpiresAt" TIMESTAMP(3) NOT NULL,
    "IP_Address" VARCHAR(191),
    "User_Agent" VARCHAR(191),

    CONSTRAINT "AppSession_pkey" PRIMARY KEY ("Session_ID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_Username_key" ON "Admin"("Username");

-- CreateIndex
CREATE UNIQUE INDEX "User_Username_key" ON "User"("Username");

-- CreateIndex
CREATE INDEX "Equipment_Admin_ID_idx" ON "Equipment"("Admin_ID");

-- CreateIndex
CREATE INDEX "Facility_Admin_ID_idx" ON "Facility"("Admin_ID");

-- CreateIndex
CREATE INDEX "Reservation_User_ID_idx" ON "Reservation"("User_ID");

-- CreateIndex
CREATE INDEX "Reservation_Equipment_ID_idx" ON "Reservation"("Equipment_ID");

-- CreateIndex
CREATE INDEX "Reservation_Admin_ID_idx" ON "Reservation"("Admin_ID");

-- CreateIndex
CREATE INDEX "Reservation_Facility_ID_idx" ON "Reservation"("Facility_ID");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_User_ID_Facility_ID_Start_DateTime_End_DateTime_key" ON "Reservation"("User_ID", "Facility_ID", "Start_DateTime", "End_DateTime");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_User_ID_Equipment_ID_Start_DateTime_End_DateTim_key" ON "Reservation"("User_ID", "Equipment_ID", "Start_DateTime", "End_DateTime");

-- CreateIndex
CREATE INDEX "AppSession_ExpiresAt_idx" ON "AppSession"("ExpiresAt");

-- CreateIndex
CREATE INDEX "AppSession_Username_idx" ON "AppSession"("Username");

-- CreateIndex
CREATE INDEX "AppSession_Role_User_ID_idx" ON "AppSession"("Role", "User_ID");

-- CreateIndex
CREATE INDEX "AppSession_Role_Admin_ID_idx" ON "AppSession"("Role", "Admin_ID");

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_Admin_ID_fkey" FOREIGN KEY ("Admin_ID") REFERENCES "Admin"("Admin_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_Admin_ID_fkey" FOREIGN KEY ("Admin_ID") REFERENCES "Admin"("Admin_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_User_ID_fkey" FOREIGN KEY ("User_ID") REFERENCES "User"("User_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_Equipment_ID_fkey" FOREIGN KEY ("Equipment_ID") REFERENCES "Equipment"("Equipment_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_Admin_ID_fkey" FOREIGN KEY ("Admin_ID") REFERENCES "Admin"("Admin_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_Facility_ID_fkey" FOREIGN KEY ("Facility_ID") REFERENCES "Facility"("Facility_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppSession" ADD CONSTRAINT "AppSession_User_ID_fkey" FOREIGN KEY ("User_ID") REFERENCES "User"("User_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppSession" ADD CONSTRAINT "AppSession_Admin_ID_fkey" FOREIGN KEY ("Admin_ID") REFERENCES "Admin"("Admin_ID") ON DELETE CASCADE ON UPDATE CASCADE;
