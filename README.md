## Barangay Facility and Equipment Management System

A full-stack barangay reservation system built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, MySQL, server-side database-backend sessions, Nodemailer, FullCalendar, and @react-pdf/renderer.

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
- Email: `user1@example.com`
- Password: `user123`

## Notes
- To test email notification use a working email account.
- For user sign up, use a working gmail/email account to make the feature works.
-For add admin, assign a real gmail/email account to make the feature works.
