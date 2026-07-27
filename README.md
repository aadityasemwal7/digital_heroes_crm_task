# Digital Heroes CRM

A robust, full-stack Customer Relationship Management (CRM) application built to handle lead capture, assignment, pipeline progression, and activity auditing.

> **Evaluation Verification**
> Built for the [Digital Heroes](https://digitalheroesco.com) Training Task.
> Live Build URL: *(Insert deployment URL here, e.g. Vercel/Render)*

---

## 🛠 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** [NextAuth.js v5](https://authjs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)

---

## 🚀 Setup & Installation Guide

### 1. Clone the repository and install dependencies
```bash
git clone <repository-url>
cd digital-heroes-crm
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory and populate it with your PostgreSQL connection string and NextAuth secret.

```env
DATABASE_URL="postgresql://user:password@localhost:5432/digital_heroes_db"
AUTH_SECRET="your-secure-random-string-here" # Generate via `npx auth secret`
```

### 3. Database Setup
Run the following commands to create the database schema and seed it with initial admin/member accounts and sample data:

```bash
# Apply schema migrations to your database
npx prisma migrate dev

# Seed the database
npx prisma db seed
```

### 4. Running the Application
Start the local development server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

To run tests (if configured):
```bash
npm run test
```

---

## 🔐 Live Credentials

Use the following seeded accounts to test the Role-Based Access Control (RBAC) features on the dashboard.

| Role   | Email | Password |
| :---   | :---  | :---     |
| **Admin**  | `admin@digitalheroes.com` | `password123` |
| **Member** | `member@digitalheroes.com`| `password123` |

---

## 📖 API Documentation

This system exposes a set of RESTful endpoints. All endpoints under `/api/leads/*` (except the public POST route) are protected and require a valid NextAuth session cookie.

### 1. Create a Public Lead
**`POST /api/leads`**
Captures a lead from the public-facing landing page.

- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "name": "Sarah Jenkins",
    "email": "sarah@nexus.io",
    "phone": "+1 (555) 123-4567",
    "company": "Nexus IO"
  }
  ```
- **Responses:**
  - `201 Created`: Lead captured successfully.
  - `400 Bad Request`: Missing `name` or `email`.
  - `500 Internal Server Error`: Database failure.

### 2. List & Filter Leads
**`GET /api/leads`**
Retrieves a paginated list of leads.

- **Auth Required:** Yes
- **Query Parameters:**
  - `page` (optional) - Current page (default: `1`)
  - `limit` (optional) - Items per page (default: `10`)
  - `status` (optional) - Filter by `NEW`, `CONTACTED`, `QUALIFIED`, `LOST`, `CONVERTED`
  - `assignedToId` (optional) - Filter by user ID
- **Example Request:** `/api/leads?page=1&limit=10&status=NEW&assignedToId=user_123`
- **Responses:**
  - `200 OK`: Returns `{ data: [...], pagination: { ... } }`
  - `401 Unauthorized`: No valid session.

### 3. Get Lead Details
**`GET /api/leads/[id]`**
Retrieves full details for a single lead, including a chronologically ordered array of `notes` and `activities`.

- **Auth Required:** Yes
- **Responses:**
  - `200 OK`: Returns full Lead object with relations.
  - `401 Unauthorized`: No valid session.
  - `404 Not Found`: Lead ID does not exist.

### 4. Update Lead (Status / Assignment)
**`PATCH /api/leads/[id]`**
Updates a lead's pipeline status or reassignment. Automatically creates a timestamped `ActivityLog` tracking the change.

- **Auth Required:** Yes
- **RBAC Rules:** 
  - `ADMIN` & `MEMBER` can update `status`.
  - **ONLY** `ADMIN` can update `assignedToId`.
- **Request Body:**
  ```json
  {
    "status": "QUALIFIED",
    "assignedToId": "user_456" 
  }
  ```
- **Responses:**
  - `200 OK`: Successfully updated. Returns updated Lead.
  - `401 Unauthorized`: No valid session.
  - `403 Forbidden`: Returned if a `MEMBER` attempts to mutate `assignedToId`.
  - `404 Not Found`: Lead ID does not exist.

### 5. Add a Note to a Lead
**`POST /api/leads/[id]/notes`**
Adds a text note to a specific lead. This operation is strictly transactional—it simultaneously creates the `Note` and an `ActivityLog`.

- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "content": "Discussed Q3 pricing tiers with the prospect."
  }
  ```
- **Responses:**
  - `201 Created`: Note successfully added.
  - `400 Bad Request`: Missing or empty `content`.
  - `401 Unauthorized`: No valid session.
  - `500 Internal Server Error`: Transaction failure.
