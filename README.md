# FixMate 🛠️

FixMate is a modern full-stack, role-based repair service platform designed to seamlessly connect customers with verified technicians for electronics, appliances, and home repair services.

---

## 🌐 Live URL
- **Live Application**: [https://fixmate-app.vercel.app](https://fixmate-app.vercel.app) *(or your deployed production URL)*

---

## 🔑 Demo Admin Credentials
Use the following credentials to access the administrative dashboard for evaluation and testing:

- **Email**: `admin@fixmate.com`
- **Password**: `Admin@123456`
- **Role**: `Admin`

---

## 📖 Purpose & Overview

FixMate is a full-stack, role-based repair service platform built with Next.js, Express, MongoDB, BetterAuth, JWT, and Stripe. 

- **Verified Technicians**: List and manage the repair services they offer (smartphone screen replacement, laptop servicing, AC servicing, refrigerator, TV, washing machine, electrical wiring, etc.).
- **Customers**: Browse available repair services, submit repair requests detailing their problem, track the job step by step in real time, and pay securely online only after the repair is completed.
- **Admins**: Review and approve technician service listings, manage registered users, monitor all active and completed repair jobs across the platform, and track overall platform revenue through Stripe.

---

## ✨ Key Features

### 👤 Role-Based Portals
- **Customer Portal**:
  - Browse categorized services (Mobile, Laptop, AC, Home Appliances, Wiring, etc.).
  - Submit detailed repair requests with issue descriptions and urgency level.
  - Transparent step-by-step repair status tracking (Pending → Accepted → In Progress → Completed → Paid).
  - Escrow-style payment workflow: pay only once the job is marked complete and verified.

- **Technician Portal**:
  - Profile setup with verification workflows.
  - Create, update, and manage service listings with transparent pricing.
  - Accept or decline incoming repair requests.
  - Update job status stages as work progresses.

- **Admin Dashboard**:
  - Review, approve, or reject technician service listings.
  - Comprehensive user and technician management.
  - Real-time monitoring of all repair jobs.
  - Financial reporting and Stripe revenue analytics.

### 💳 Payments & Security
- **Stripe Integration**: Automated checkout sessions for secure post-repair payments.
- **Robust Authentication**: Powered by BetterAuth and JWT session tokens for role verification.

---

## 🧰 Tech Stack & NPM Packages

### Frontend (Client)
- **Framework**: [Next.js](https://nextjs.org/) (React 19 / App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Core Packages**:
  - `next`
  - `react`, `react-dom`
  - `better-auth` – Authentication & session management
  - `@stripe/stripe-js`, `@stripe/react-stripe-js` – Payment processing
  - `lucide-react` – UI icons
  - `axios` – HTTP requests
  - `clsx`, `tailwind-merge` – Conditional styling utilities

### Backend (Server)
- **Runtime & Framework**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Core Packages**:
  - `express` – Web application server
  - `mongoose` – MongoDB object modeling
  - `jsonwebtoken` – JWT authentication & token signing
  - `stripe` – Stripe payment SDK
  - `cors` – Cross-Origin Resource Sharing
  - `dotenv` – Environment variable management
  - `bcryptjs` – Password hashing & security
  - `zod` – Request validation schemas

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB database (local or MongoDB Atlas)
- Stripe developer account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rmr193/Fixmate.git
   cd Fixmate
   ```

2. **Frontend Setup:**
   ```bash
   cd client # or frontend
   npm install
   npm run dev
   ```

3. **Backend Setup:**
   ```bash
   cd server # or backend
   npm install
   npm run dev
   ```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
