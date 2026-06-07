# QuickBite — Food 
Delivery Platform

QuickBite is a complete, feature-rich Food Delivery Application featuring a Next.js (App Router) frontend, a Node.js + Express.js backend, and a PostgreSQL database (Neon DB).

---

## 🛠️ Preferred Tech Stack

- **Frontend**: React, Next.js (App Router), Tailwind CSS 4, Axios, Lucide Icons.
- **Backend**: Node.js, Express.js, TypeScript, PostgreSQL Client (`pg`), JWT, Bcrypt.
- **Database**: Neon DB (PostgreSQL).

---

## 📂 Project Architecture

```
food-delivery-app/
├── client/                      # Next.js Frontend
│   ├── app/                     # Page routes (layout, homepage, checkout, dashboard)
│   ├── components/              # Contexts (AuthContext) and Reusable UI Cards
│   └── services/                # Axios Client with request JWT interceptors
└── server/                      # Node/Express Backend
    ├── config/                  # DB Pool configuration
    ├── controllers/             # Auth, Restaurants, Cart, and Order handlers
    ├── db/                      # schema.sql and setup.ts seeding script
    ├── middleware/              # JWT verification and Role middleware
    └── routes/                  # Express Router path mappings
```

---

## 🚀 Setup & Installation

Follow these steps to get the platform running locally:

### 1. Prerequisite: Database Connection
Ensure database variables are configured in `server/.env`. This setup has already been completed using Neon DB.

### 2. Configure and Initialize the Database
Open your terminal and run the database setup and seeding script. This creates all tables and seeds mock testing data:
```bash
cd server
bun install
bun run db/setup.ts
```

### 3. Start the Backend API Server
Launch the Express.js API server (runs on `http://localhost:5001`):
```bash
bun run index.ts
```



### 4. Configure and Launch the Next.js Frontend

Copy the environment template file and run the frontend development server (runs on `http://localhost:3000`):
```bash
cd client
cp .env.example .env.local
bun install
bun run dev
```

---

## 🔑 Assessment Test Credentials

For quick evaluation of all role-based experiences, use these pre-seeded credentials at the `/login` route:

| Persona | Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | `customer` | `customer1@quickbite.com` | `customer123` | Search/filter, add items to cart, checkout, view live order steppers, and write reviews. |
| **Restaurant Owner** | `restaurant` | `owner1@quickbite.com` | `owner123` | Create menu category headers, list/edit/delete dishes, accept/reject orders, and transition order states. |
| **Platform Admin** | `admin` | `admin@quickbite.com` | `admin123` | View revenue stats and registration volume, list all accounts, and block/unblock users. |