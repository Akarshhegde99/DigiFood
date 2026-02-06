# 🍽️ Smart Restaurant Pre-Ordering System

A production-ready full-stack system for modern restaurants. Customers can browse menus, schedule visits, and pay 50% in advance to skip the wait. Admins manage orders in real-time.

## ✨ Features

- **OTP-like Login**: Simple Email/Password authentication for customers.
- **Premium UI**: Built with Next.js 15, Tailwind CSS, and Framer Motion for smooth animations.
- **Menu Management**: Categorized menu browsing with search and real-time availability.
- **Scheduling**: Integration of visit date and time selection during checkout.
- **Partial Payments**: 50% Pay Now / 50% Pay Later logic simulation.
- **Admin Dashboard**:
  - Real-time order notifications (Supabase Realtime).
  - Vibrate alert for new orders.
  - Approve/Reject workflow.
  - Order filtering (Pending, Approved, Rejected).
- **Invoices**: On-the-fly PDF generation for orders using `pdf-lib`.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion.
- **Backend**: Next.js Server Actions.
- **Database/Auth**: Supabase (PostgreSQL).
- **Invoices**: pdf-lib.
- **Notifications**: react-hot-toast.

## 🚀 Setup Instructions

1. **Clone the repository.**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env.local` based on `.env.example`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=...
   ```
4. **Database Setup**:
   - Run the SQL in `schema.sql` inside your Supabase SQL Editor.
5. **Run Development Server**:
   ```bash
   npm run dev
   ```
6. **Seed Data**:
   - Login as Admin at `/admin`.
   - Click the **Seed Data** button to populate categories and menu items.

## 📦 Deployment

This project is ready to be deployed to **Vercel** for free.
- Connect your GitHub repo to Vercel.
- Add the environment variables from `.env.local`.
- Ensure Supabase project is active and real-time is enabled for the `orders` table.

---

Built with ❤️ by Antigravity.
