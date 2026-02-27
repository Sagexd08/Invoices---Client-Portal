# Client Portal & Invoicing System

A modern, full-stack Client Portal and Invoicing System built with Next.js 15, React, Tailwind CSS, Prisma, Neon Postgres, and Razorpay. This platform provides specialized dashboards for both **Company Admins** and **Clients**, enabling secure, high-value transaction processing and efficient business management.

## 🚀 Features

### For the Company (Admin)
- **Advanced Dashboard:** High-level overview of Active Clients, Outstanding AR, Collected Revenue, and Overdue payments.
- **Client Management:** Easily onboard and manage all client profiles.
- **Invoice Generation:** Generate, issue, and track invoices seamlessly.
- **Payment Processing:** Secure payment tracking through Razorpay webhooks, preventing discrepancies.
- **Role-Based Access Control (RBAC):** Restrict views and actions based on user roles (Admin vs. Client vs. Employee).

### For the Client
- **Secure Portal:** View outstanding invoices, payment history, and personalized dashboards.
- **One-Click Payments:** Pay invoices seamlessly using the integrated Razorpay checkout module.
- **Live Status:** Real-time updates on payment confirmation using robust webhook handling.

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Email/Password & Google OAuth)
- **Database:** [Neon Serverless Postgres](https://neon.tech/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Payments:** [Razorpay](https://razorpay.com/)
- **UI Components:** [Lucide React](https://lucide.dev/) + Custom design tokens

## 📦 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
- Node.js (v18 or higher)
- npm or yarn
- A Neon Postgres Database
- A Razorpay Account (Test credentials for development)
- Google Cloud Console Project (For OAuth credentials)

### 1. Clone the repository

```bash
git clone https://github.com/Sagexd08/Invoices---Client-Portal.git
cd "Invoices & Client Portal/client-portal"
```

### 2. Install Dependencies

```bash
yarn install
# or
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root of the `client-portal` directory and configure the following variables:

```env
# Database
DATABASE_URL="postgresql://<user>:<password>@<neon_endpoint>.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://<user>:<password>@<neon_endpoint>.neon.tech/neondb?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3001" # Or your production URL

# OAuth (Google)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Razorpay
RAZORPAY_KEY_ID="rzp_test_your_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"
```

### 4. Database Setup

Push the Prisma schema to your Neon database:

```bash
npx prisma db push
```

### 5. Run the Development Server

Start the application on port 3001 (as configured):

```bash
yarn dev -p 3001
# or
npm run dev -- -p 3001
```

Open [http://localhost:3001](http://localhost:3001) with your browser to use the application.

## 📝 License

This project is licensed under the MIT License.
