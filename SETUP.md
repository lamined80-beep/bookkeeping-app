# Bookkeeping App - Setup & Testing Guide

## Prerequisites

- Node.js 18+ (currently using Node 22)
- npm 10+
- PostgreSQL 15+ (using Docker Compose recommended)
- Git

## Quick Start (Development)

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

cd ..
```

### 2. Set Up Database

The application uses PostgreSQL with Prisma ORM. You have two options:

#### Option A: Docker Compose (Recommended)

```bash
# Start all services (PostgreSQL, Backend API, Frontend UI, Adminer)
docker-compose up -d

# Wait for services to be healthy (about 30-60 seconds)
docker-compose ps

# Run Prisma migrations
cd backend
npm run db:setup
```

#### Option B: Local PostgreSQL

If you have PostgreSQL running locally:

```bash
# Update .env with your local database URL
# DATABASE_URL="postgresql://user:password@localhost:5432/bookkeeping"

# Run migrations
cd backend
npm run db:setup
npm run db:seed
```

### 3. Start the Application

```bash
# Terminal 1: Start Backend API (Port 5000)
cd backend
npm run dev

# Terminal 2: Start Frontend UI (Port 5173)
cd frontend
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **Database Admin** (if using Docker): http://localhost:8080 (Adminer)

### 5. Demo Credentials

After running `npm run db:seed` in the backend:

**Email**: demo@bookkeeping.local  
**Password**: password123  
**Company**: Demo Company (Alberta, GST 5%)

## Available npm Scripts

### Backend

```bash
npm run dev           # Start dev server with auto-reload
npm run build         # Build TypeScript
npm run start         # Start production build
npm run db:setup      # Run Prisma migrations
npm run db:seed       # Seed demo data
npm run type-check    # Type checking
npm run lint          # ESLint (if configured)
```

### Frontend

```bash
npm run dev           # Start Vite dev server
npm run build         # Build for production
npm run preview       # Preview production build
npm run type-check    # Type checking
npm run lint          # ESLint (if configured)
```

## API Endpoints

All endpoints require JWT authentication (except /auth endpoints).

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/verify` - Verify token validity
- `POST /api/auth/logout` - Logout

### Clients

- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get client details
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Invoices

- `GET /api/invoices` - List all invoices
- `GET /api/invoices/:id` - Get invoice details
- `POST /api/invoices` - Create invoice (auto-generates journal entry)
- `POST /api/invoices/:id/payments` - Record payment (updates status, creates payment entry)

### Accounting

- `GET /api/accounting/trial-balance` - Trial balance report
- `GET /api/accounting/ledger/:accountId` - General ledger for account
- `GET /api/accounting/reports/profit-loss` - Profit & Loss statement
- `GET /api/accounting/dashboard/kpis` - Dashboard KPIs

### Expenses

- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/categories` - List categories

### Estimates

- `GET /api/estimates` - List estimates
- `GET /api/estimates/:id` - Get estimate details
- `POST /api/estimates` - Create estimate

## End-to-End Workflow Test

This is the recommended sequence to test Phase 1 MVP:

### Step 1: Register & Login

1. Navigate to http://localhost:5173
2. Click "Register" (or use demo@bookkeeping.local / password123)
3. Fill in:
   - Name: "Your Name"
   - Company: "Test Company"
   - Province: "Ontario" (for HST 13% testing)
4. Click "Register"
5. You should be redirected to Dashboard

### Step 2: Create Client

1. Click "Add Client" card or go to /clients
2. Fill in:
   - Client Name: "Acme Corp"
   - Email: "contact@acme.local"
   - Phone: "555-0100"
   - Billing Address: "123 Main St, Toronto, ON"
3. Click "Create Client"
4. Verify client appears in list

### Step 3: Create Invoice

1. Click "New Invoice" card or go to /invoices
2. Fill in:
   - Client: "Acme Corp"
   - Issue Date: Today
   - Due Date: 30 days from today
3. Add line items:
   - Description: "Consulting Services"
   - Qty: 1
   - Unit Price: 1000.00
4. Add another line:
   - Description: "Software License"
   - Qty: 2
   - Unit Price: 500.00
5. Verify total calculates correctly (including GST/HST)
6. Click "Create Invoice"
7. Invoice should appear in list with "DRAFT" status

### Step 4: Verify Accounting

1. Go to Dashboard
2. Check KPIs:
   - **Accounts Receivable** should show invoice total
   - **Total Income** should show revenue amount
   - **Net Profit** should match revenue minus any expenses
3. If available, check Trial Balance report:
   - Navigate to Reports → Trial Balance
   - Verify debit total = credit total (balanced)
   - Verify Accounts Receivable account shows invoice amount

### Step 5: Record Payment

1. Go to Invoices
2. Click on the invoice (when implemented)
3. Click "Record Payment"
4. Enter payment amount
5. Verify invoice status changes to "PAID" or "PARTIAL"
6. Verify KPIs update in dashboard
7. Verify A/R decreases

## Troubleshooting

### Database Connection Error

If you see `ECONNREFUSED`:
- Ensure PostgreSQL is running: `docker-compose ps`
- Check DATABASE_URL in .env is correct
- Verify port 5432 is not blocked

### Port Already in Use

```bash
# Find and kill process on port 5000
lsof -ti :5000 | xargs kill -9

# Find and kill process on port 5173
lsof -ti :5173 | xargs kill -9
```

### Prisma Migration Issues

```bash
# Reset database (WARNING: deletes all data)
cd backend
npx prisma migrate reset

# Or manually:
npx prisma migrate dev --name init
npm run db:seed
```

### CORS Issues

If frontend can't reach backend:
- Verify backend is running: `curl http://localhost:5000/health`
- Check CORS_ORIGIN in backend .env includes `http://localhost:5173`
- Check browser console for CORS errors

### Frontend Can't Load Data

1. Open browser DevTools (F12)
2. Check Network tab for API requests
3. Check Console for JavaScript errors
4. Verify auth token in localStorage: `localStorage.getItem('authToken')`

## Architecture Overview

### Backend (Express.js + TypeScript)

```
backend/
├── src/
│   ├── server.ts              # Express app & routes setup
│   ├── middleware/
│   │   ├── auth.ts            # JWT verification & role checks
│   │   └── errorHandler.ts    # Error handling middleware
│   ├── routes/
│   │   ├── auth.ts            # Registration, login, verification
│   │   ├── clients.ts         # Client CRUD
│   │   ├── invoices.ts        # Invoice CRUD + payments
│   │   ├── accounting.ts      # Reports & KPIs
│   │   ├── expenses.ts        # Expense management
│   │   ├── estimates.ts       # Estimate management
│   │   └── company.ts         # Company settings
│   ├── utils/
│   │   ├── jwt.ts             # Token generation/verification
│   │   └── validation.ts      # Input validation
│   └── types/
│       └── index.ts           # TypeScript interfaces
├── prisma/
│   ├── schema.prisma          # Database schema (25+ models)
│   └── seed.ts                # Demo data seeding
└── package.json
```

### Frontend (React + TypeScript + Tailwind)

```
frontend/
├── src/
│   ├── App.tsx                # Main router
│   ├── main.tsx               # React entry point
│   ├── services/
│   │   └── api.ts             # Axios API client
│   ├── hooks/
│   │   └── useAuth.tsx        # Auth context & state
│   ├── components/
│   │   └── PrivateRoute.tsx   # Protected route wrapper
│   ├── pages/
│   │   ├── LoginPage.tsx      # Login form
│   │   ├── RegisterPage.tsx   # Registration form
│   │   ├── DashboardPage.tsx  # KPI dashboard
│   │   ├── ClientsPage.tsx    # Client management
│   │   ├── InvoicesPage.tsx   # Invoice management
│   │   └── NotFoundPage.tsx   # 404 page
│   └── index.css              # TailwindCSS
└── package.json
```

### Database (PostgreSQL + Prisma)

**Key Models**:
- `User` - Authentication & company ownership
- `Company` - Multi-tenant isolation, GST/HST settings
- `Client` - Customer records
- `Invoice` - Invoices with line items
- `PaymentReceived` - Payment tracking
- `Supplier` - Vendor records
- `Bill` - Purchase orders
- `Expense` - Expense records
- `ChartOfAccount` - General ledger accounts
- `JournalEntry` - Accounting entries (double-entry)
- `JournalLine` - Individual debit/credit lines
- `BankAccount` - Bank account records
- `BankStatement` - Bank import history
- `BankReconciliation` - Reconciliation state
- `Vehicle` - Mileage tracking
- `MileageTrip` - Mileage records
- `Document` - File storage
- `AuditLog` - Action history

## Next Steps (Phase 2)

- [ ] PDF Invoice Generation
- [ ] Email Integration (send invoices, reminders)
- [ ] Bank Reconciliation UI
- [ ] Receipt OCR with Textract/Tesseract
- [ ] Advanced Reporting (Dashboards, custom filters)
- [ ] Mobile Responsive Refinement
- [ ] Two-Factor Authentication
- [ ] API Rate Limiting Enhancements
- [ ] Backup & Disaster Recovery UI
- [ ] Document Management System

## Security Checklist

- [x] JWT authentication with 7-day expiry
- [x] Password hashing (bcrypt)
- [x] Role-based access control (OWNER/ACCOUNTANT)
- [x] Company-level data isolation (company_id checks)
- [x] CORS configuration
- [x] Rate limiting on auth endpoints
- [x] Automatic token cleanup on 401
- [ ] HTTPS in production
- [ ] Environment variable protection
- [ ] API key rotation
- [ ] Audit logging for sensitive operations

## Support & Reporting Issues

For issues:
1. Check browser DevTools Console (F12)
2. Check backend logs: `docker logs bookkeeping-api`
3. Check database logs: `docker logs bookkeeping-db`
4. Review error messages in Adminer (http://localhost:8080)

---

**Status**: Phase 1 MVP Complete (Scaffolding & Core Routes)  
**Last Updated**: 2026-09-11  
**Next Milestone**: Phase 2 (PDF, Email, OCR)
