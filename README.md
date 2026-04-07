# Barangay Facility and Equipment Management System

A full-stack barangay reservation system built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, MySQL, NextAuth.js, Nodemailer, FullCalendar, and @react-pdf/renderer.

## Features

- User and administrator authentication
- Barangay resident portal
- Admin dashboard with approvals and management tools
- Facility and equipment catalog
- Reservation requests and status tracking
- Email notifications on new requests and status updates
- Live calendar of approved reservations
- PDF receipts for approved reservations
- Reservation summary PDF export
- Seed data for demo accounts and sample records

## Prerequisites

- Node.js 18+
- MySQL database

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create the database and set your environment variables using `.env.example`.

3. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```

4. Seed the database:
   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Default Demo Credentials

Admin:
- Email: `admin@example.com`
- Password: `admin123`

User:
- Email: `user@example.com`
- Password: `user123`

## Notes

- Passwords are stored as short demo hashes because the provided Prisma schema keeps the password columns at `VARCHAR(50)`.
- Email delivery uses Nodemailer and can be pointed to Ethereal SMTP for local testing.
- The app uses route handlers in the App Router for CRUD operations and PDF generation.
