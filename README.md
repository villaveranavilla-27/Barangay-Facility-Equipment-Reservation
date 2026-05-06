# Barangay Facility and Equipment Management System

A full-stack barangay reservation system built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, MySQL, server-side database-backed sessions, Nodemailer, FullCalendar, and @react-pdf/renderer.

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
- Auth uses server-side `AppSession` rows in MySQL. The browser stores only an opaque `__Host-barangay-go-session` cookie with `HttpOnly`, `Secure`, `SameSite=Lax`, and no client-side expiry.
- Sessions expire after 10 minutes of inactivity or 30 minutes from login, whichever happens first.
- Optional hardening flags are available through `SESSION_BIND_USER_AGENT` and `SESSION_BIND_IP`. Both default to `false` to avoid false logouts on mobile or proxied networks.
- Email delivery uses Gmail SMTP with these server-side variables: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, and `EMAIL_FROM`.
- Use the same mail variable names in local `.env`, Vercel, and Railway so deployments match local behavior.
- The app uses route handlers in the App Router for CRUD operations and PDF generation.
