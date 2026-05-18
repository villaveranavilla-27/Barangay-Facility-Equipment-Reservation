## Barangay Facility and Equipment Management System

A full-stack barangay reservation system built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, Supabase PostgreSQL, server-side database-backed sessions, Nodemailer, FullCalendar, and @react-pdf/renderer.

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
- Supabase PostgreSQL database

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create the database and set your environment variables using `.env.example`.

3. Apply Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. Seed the database:
   ```bash
   npx prisma db seed
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
- For Vercel deployments, configure `DATABASE_URL` and optionally `DIRECT_URL` with your Supabase Postgres connection strings.
