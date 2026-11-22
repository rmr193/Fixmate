# FixMate 🛠️ — Smart Device & Home Appliance Repair Service Platform

FixMate is a production-grade, full-stack, role-based on-demand repair service marketplace built with **Next.js 15 (App Router)**, **Express.js**, **TypeScript**, **MongoDB**, **BetterAuth**, **JWT**, **Stripe Checkout + Webhooks**, and **ImgBB**.

It connects device and home appliance owners with verified repair specialists through a transparent, auditable status pipeline (**Requested → Accepted → In Progress → Completed → Paid**) where online payment unlocks **only after the job is completed**.

---

## 🌐 Live URL & Repositories
- **Live Application**: [https://fixmate-app.vercel.app](https://fixmate-app.vercel.app)
- **Client Repository**: [https://github.com/rmr193/Fixmate/tree/main/client](https://github.com/rmr193/Fixmate)
- **Server Repository**: [https://github.com/rmr193/Fixmate/tree/main/server](https://github.com/rmr193/Fixmate)

---

## 🔑 Demo Credentials (Pre-Seeded & Ready for Evaluation)

| Role | Email | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@fixmate.com` | `Admin@123456` | Moderate pending services, manage user roles, monitor all bookings & verified Stripe revenue |
| **Technician 1** | `tech@fixmate.com` | `Tech@123456` | Senior Smartphone & Laptop Specialist (Arif Rahman) — CRUD services, progress assigned jobs |
| **Technician 2** | `rafiq.tech@fixmate.com` | `Tech@123456` | Certified HVAC, Split AC & Refrigerator Engineer (Engr. Rafiqul Islam) |
| **Technician 3** | `nadia.tech@fixmate.com` | `Tech@123456` | Smart TV, Washing Machine & Electrical Engineer (Nadia Karim) |
| **Customer 1** | `customer@fixmate.com` | `Customer@123456` | Browse services, send repair requests, cancel pending requests, pay for completed jobs via Stripe |
| **Customer 2** | `sadia@fixmate.com` | `Customer@123456` | Customer account with active & historical repair bookings |

> **Tip**: On `/sign-in`, use the **Quick Fill Demo Accounts** buttons (`Customer`, `Technician`, `Admin`) for instant 1-click evaluation.

---

## 🎯 Problem Statement & Solution

In traditional device and home appliance repair markets:
1. **Customers** struggle to find verified technicians, have zero visibility into repair progress once they hand over an expensive device, and are often forced to pay upfront before work is delivered.
2. **Technicians** lack a structured platform to showcase their technical specialties, manage incoming repair queues, and receive guaranteed online payments.

**FixMate solves both challenges**:
- Every technician service listing passes through an **Admin Approval Queue** (`pending` → `approved` / `rejected`).
- Customers submit repair requests with zero upfront charge and track live status transitions via an interactive **Job Timeline Step Tracker**.
- Server-enforced payment gating ensures the **Pay Now** button and **Stripe Checkout Session** unlock strictly when `status === 'completed'` and `paymentStatus === 'unpaid'`.

---

## ✨ Key Features & Assignment Challenge Coverage

### 1. Three Role-Based Portals & Dashboards
- **Customer Portal (`/dashboard/customer`, `/bookings`, `/payments`)**:
  - Overview KPI cards (**Total Requests**, **Active Jobs**, **Completed Jobs**) and pipeline distribution chart.
  - Real-time booking tracker with confirmation modal for cancelling `'requested'` jobs.
  - **Pay Now** Stripe Checkout integration for `'completed'` & `'unpaid'` jobs.
  - Verified payment history with **Printable / PDF Official Invoice Viewer** and **1–5 Star Technician Review** submission.
- **Technician Portal (`/dashboard/technician`, `/add-service`, `/my-services`, `/requests`)**:
  - Overview KPI cards (**Total Services**, **Approved Services**, **Pending Requests**) and verified earnings ledger.
  - **Add Service** form with **ImgBB file upload**, category & service mode selection (`Home Visit` / `Shop Drop-off`).
  - **My Services** full CRUD with live availability toggle (`isAvailable`) and automatic `approvalStatus: 'pending'` reset on edit.
  - **Manage Requests** status pipeline controls (`Accept`, `Reject`, `Start Work`, and `Mark Completed` modal to enter final billing amount).
- **Admin Dashboard (`/dashboard/admin`, `/users`, `/services`, `/bookings`, `/transactions`)**:
  - Overview KPI cards (**Total Users**, **Total Technicians**, **Pending Services**, **Total Revenue**) and visual analytics charts.
  - **Manage Users** with role assignment (`customer` / `technician` / `admin`) and server-enforced self-role-change protection.
  - **Service Approval** moderation queue with pending listings prioritized first.
  - **All Bookings** read-only platform monitor with status filters.
  - **Transactions** ledger calculating total platform revenue from verified Stripe payment records.
- **Shared Profile Management (`/dashboard/profile`)**:
  - Update Name, Phone, Area, Bio, and ImgBB Profile Photo with instant live sync to the Navbar and Dashboard Top Bar without logging out.

### 2. All Four Assignment Challenges Implemented
- **Challenge 1 — Server-Side Search, Filter & Sort**:
  - `/services` executes all text search (`title`, `category`, `description`, `serviceArea`, `technicianName`), `category` filtering, `serviceMode` filtering, and sorting (`price_asc`, `price_desc`, `newest`) directly in MongoDB. All filters persist via URL query parameters (`/services?category=AC&sort=price_asc`).
- **Challenge 2 — JWT Verification & Role-Based Express Middlewares**:
  - Custom Express middlewares (`verifyToken`, `verifyCustomer`, `verifyTechnician`, `verifyAdmin`) verify HS256 JWT signature & expiration, resolve the authoritative user document from MongoDB `users`, return `401 Unauthorized` for missing/invalid tokens and `403 Forbidden` for role violations, and enforce strict resource ownership.
- **Challenge 3 — Server-Enforced Job Status Pipeline & Payment Gate**:
  - Strict state machine (`requested → accepted | rejected | cancelled`, `accepted → in-progress`, `in-progress → completed` with `finalAmount > 0`, `completed + unpaid → paid`). Rejects all invalid jumps and duplicate active requests (`409 Conflict`).
- **Challenge 4 — Stripe Webhook Signature Verification, Idempotency & Server-Side Pagination**:
  - `POST /api/payments/webhook` verifies `stripe-signature` using raw request body buffer and shares an atomic, unique-indexed idempotent payment recorder (`recordVerifiedPayment`) with `GET /api/payments/verify` so no payment is ever saved twice.
  - `/services` implements server-side pagination using MongoDB `.skip()` and `.limit()`.

---

## 🧱 System Architecture & Monorepo Structure

```text
fixmate/
├── client/                     # Next.js 15 (App Router) + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── app/                # Public routes, Auth routes, Role Dashboards, API Auth bridge
│   │   ├── components/         # Design system UI primitives, Navbar, Footer, Modals, Cards
│   │   ├── lib/                # BetterAuth config, JWT API client, ImgBB upload helper
│   │   ├── providers/          # AuthContext, TanStack Query, ThemeProvider, Sonner Toaster
│   │   └── types/              # Shared TypeScript interfaces
├── server/                     # Express.js + TypeScript + MongoDB Native Driver
│   ├── src/
│   │   ├── config/             # Environment config & MongoDB 4-collection connection/indexes
│   │   ├── middlewares/        # verifyToken, verifyCustomer, verifyTechnician, verifyAdmin
│   │   ├── routes/             # auth, user, service, booking, payment, admin modules
│   │   ├── scripts/            # Realistic seed script (seed.ts) & API test suite (test-api.ts)
│   │   └── types/              # Strict 4-collection document interfaces
├── design-system/fixmate/      # UI/UX Pro Max Master Design System & Dashboard Overrides
├── PROJECT_PROGRESS.md         # Milestone & verification tracker
├── README.md                   # Documentation
└── package.json                # Root workspace scripts
```

---

## 🗄️ Database Design (Exactly 4 Application Collections)

1. **`users`**: `_id`, `name`, `email` (unique), `image`, `role` (`'customer' | 'technician' | 'admin'`), `phone`, `area`, `bio`.
2. **`services`**: `_id`, `title`, `category`, `description`, `image`, `basePrice`, `estimatedDuration`, `serviceMode`, `serviceArea`, `technicianName`, `technicianEmail`, `approvalStatus` (`'pending' | 'approved' | 'rejected'`), `isAvailable`, `createdAt`.
3. **`bookings`**: `_id`, `serviceId`, `serviceTitle`, `serviceImage`, `category`, `basePrice`, `technicianName`, `technicianEmail`, `customerName`, `customerEmail`, `customerPhone`, `address`, `preferredDate`, `problemDescription`, `status` (`'requested' | 'accepted' | 'rejected' | 'in-progress' | 'completed' | 'cancelled'`), `finalAmount`, `paymentStatus` (`'unpaid' | 'paid'`).
4. **`payments`**: `_id`, `bookingId` (unique), `serviceTitle`, `customerName`, `customerEmail`, `technicianName`, `technicianEmail`, `amount`, `currency` (`'usd'`), `transactionId`, `stripeSessionId` (unique), `paymentStatus` (`'paid'`), `paidAt`.

---

## 🔌 REST API Documentation

| Method | Endpoint | Access / Middlewares | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register Customer or Technician (blocks public admin registration) |
| `POST` | `/api/auth/login` | Public | Authenticate credentials and issue signed HS256 JWT |
| `POST` | `/api/auth/jwt` | Public | Exchange BetterAuth session token for Express API JWT |
| `GET` | `/api/auth/me` | `verifyToken` | Retrieve authoritative user profile and refreshed JWT |
| `GET` | `/api/users/profile` | `verifyToken` | Get current user profile |
| `PATCH` | `/api/users/profile` | `verifyToken` | Update Name, Phone, Area, Bio, and ImgBB Profile Photo |
| `POST` | `/api/users/upload-image` | `verifyToken` | Upload base64 image via ImgBB API |
| `GET` | `/api/services/featured` | Public | Fetch 6 latest approved & available services |
| `GET` | `/api/services` | Public | Server-side search, filter, sort & MongoDB `.skip()/.limit()` pagination |
| `GET` | `/api/services/:id` | Public | Fetch approved service details, technician summary & customer reviews |
| `GET` | `/api/services/my` | `verifyToken`, `verifyTechnician` | List technician's owned services & overview stats |
| `POST` | `/api/services` | `verifyToken`, `verifyTechnician` | Create new service (`approvalStatus: 'pending'`, `isAvailable: true`) |
| `PATCH` | `/api/services/:id` | `verifyToken`, `verifyTechnician` | Edit owned service (resets `approvalStatus: 'pending'`) or toggle availability |
| `DELETE` | `/api/services/:id` | `verifyToken`, `verifyTechnician` | Delete owned service |
| `POST` | `/api/bookings` | `verifyToken`, `verifyCustomer` | Create repair request with duplicate active request guard |
| `GET` | `/api/bookings/my` | `verifyToken`, `verifyCustomer` | List customer's bookings & overview stats |
| `PATCH` | `/api/bookings/:id/cancel` | `verifyToken`, `verifyCustomer` | Cancel an owned booking while `status === 'requested'` |
| `POST` | `/api/bookings/:id/review` | `verifyToken`, `verifyCustomer` | Submit 1–5 star rating & review on a completed, paid booking |
| `GET` | `/api/bookings/technician` | `verifyToken`, `verifyTechnician` | List repair requests assigned to the logged-in technician |
| `PATCH` | `/api/bookings/:id/status` | `verifyToken`, `verifyTechnician` | Advance job status through strict pipeline & set `finalAmount` |
| `POST` | `/api/payments/create-checkout-session` | `verifyToken`, `verifyCustomer` | Create Stripe Checkout Session for a completed, unpaid booking |
| `GET` | `/api/payments/verify` | `verifyToken`, `verifyCustomer` | Verify Stripe Checkout session & record payment idempotently |
| `POST` | `/api/payments/webhook` | Stripe Signature | Raw-body Stripe Webhook endpoint for `checkout.session.completed` |
| `GET` | `/api/payments/my` | `verifyToken`, `verifyCustomer` | List verified payment history for the logged-in customer |
| `GET` | `/api/payments/:id/invoice` | `verifyToken` | Retrieve official invoice data for a paid booking |
| `GET` | `/api/admin/stats` | `verifyToken`, `verifyAdmin` | Platform KPIs, category distribution & booking status analytics |
| `GET` | `/api/admin/users` | `verifyToken`, `verifyAdmin` | List all users with search & role filter |
| `PATCH` | `/api/admin/users/:id/role` | `verifyToken`, `verifyAdmin` | Change a user's role (blocks admin self-demotion) |
| `GET` | `/api/admin/services` | `verifyToken`, `verifyAdmin` | List all services across technicians (pending prioritized first) |
| `PATCH` | `/api/admin/services/:id/approval` | `verifyToken`, `verifyAdmin` | Approve or reject a technician service |
| `GET` | `/api/admin/bookings` | `verifyToken`, `verifyAdmin` | Read-only monitor of all platform bookings with status filter |
| `GET` | `/api/admin/payments` | `verifyToken`, `verifyAdmin` | List all verified transactions & total platform revenue |

---

## ⚙️ Environment Variables

### Backend (`server/.env`)
See [server/.env.example](file:///d:/Web%20Dev%20Projects/Fix%20mate/server/.env.example):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/fixmate
MONGODB_DB_NAME=fixmate
BETTER_AUTH_SECRET=replace_with_secure_32_char_secret_key
BETTER_AUTH_URL=http://localhost:3000
JWT_SECRET=replace_with_secure_jwt_signing_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
TRUSTED_ORIGINS=http://localhost:3000,https://fixmate-app.vercel.app
STRIPE_SECRET_KEY=sk_test_replace_with_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_replace_with_your_stripe_webhook_secret
IMGBB_API_KEY=replace_with_your_imgbb_api_key
```

### Frontend (`client/.env.local`)
See [client/.env.example](file:///d:/Web%20Dev%20Projects/Fix%20mate/client/.env.example):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_IMGBB_API_KEY=replace_with_your_imgbb_api_key
MONGODB_URI=mongodb://127.0.0.1:27017/fixmate
MONGODB_DB_NAME=fixmate
BETTER_AUTH_SECRET=replace_with_secure_32_char_secret_key
BETTER_AUTH_URL=http://localhost:3000
JWT_SECRET=replace_with_secure_jwt_signing_secret_key
```

---

## 🚀 Installation & Local Development

1. **Install dependencies**:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. **Seed the database with realistic demo accounts, 16 services, 8 bookings & 3 payments**:
   ```bash
   npm run seed
   ```

3. **Run the automated backend integration test suite**:
   ```bash
   npm run test:api
   ```

4. **Start backend and frontend servers**:
   ```bash
   # Terminal 1 (Express API Server on http://localhost:5000)
   npm run dev:server

   # Terminal 2 (Next.js App Router Client on http://localhost:3000)
   npm run dev:client
   ```

---

## 📄 License
This project is licensed under the MIT License.
