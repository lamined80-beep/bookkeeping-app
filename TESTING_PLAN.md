# Testing Plan - Phase 1 MVP

This document outlines the testing strategy for Phase 1 MVP of the Bookkeeping App.

## Test Levels

### 1. Unit Tests (Backend)
Tests for individual functions and business logic.

### 2. Integration Tests (Backend + Database)
Tests for complete workflows involving multiple components.

### 3. API Tests (Backend + Frontend)
Tests for API endpoints and data integrity.

### 4. UI Tests (Frontend)
Tests for user interactions and state management.

### 5. End-to-End (E2E) Tests
Complete user workflows from registration to reporting.

---

## Phase 1 Test Checklist

### A. Authentication & Authorization

#### A.1 Registration Flow
- [ ] **Test**: User can register with valid data
  - Navigate to `/register`
  - Fill in: Name, Company, Province
  - Click "Register"
  - Expected: Redirected to dashboard, localStorage contains authToken
  
- [ ] **Test**: Registration rejects invalid password (< 8 chars, no uppercase, no number)
  - Try each invalid password variant
  - Expected: Error message displayed
  
- [ ] **Test**: Registration rejects duplicate email
  - Register with existing email
  - Expected: Error message "Email already in use"
  
- [ ] **Test**: Company settings persist (GST/HST rate by province)
  - Register for different provinces
  - Expected: Correct tax rate calculated for invoices

#### A.2 Login Flow
- [ ] **Test**: User can login with correct credentials
  - Email: demo@bookkeeping.local
  - Password: password123
  - Expected: Redirected to dashboard
  
- [ ] **Test**: Login rejects incorrect password
  - Expected: Error message "Invalid credentials"
  
- [ ] **Test**: Token is stored in localStorage
  - Login and check localStorage
  - Expected: authToken present with valid JWT

#### A.3 Protected Routes
- [ ] **Test**: Unauthenticated user redirected to login
  - Clear localStorage (logout)
  - Navigate to `/dashboard`
  - Expected: Redirected to `/login`
  
- [ ] **Test**: Token expiry (if implemented)
  - Create old token manually
  - Expected: Automatic redirect to login, token cleared

#### A.4 Role-Based Access Control
- [ ] **Test**: OWNER can access all features
  - Login as owner
  - Verify access to: Clients, Invoices, Reports, Settings
  
- [ ] **Test**: ACCOUNTANT has restricted access
  - If multiple roles implemented, verify restrictions

---

### B. Client Management

#### B.1 Create Client
- [ ] **Test**: Valid client creation
  - Navigate to `/clients`
  - Click "New Client"
  - Fill: Name (required), Email, Phone, Address
  - Click "Create Client"
  - Expected: Client appears in list

- [ ] **Test**: Duplicate client names rejected
  - Try creating client with same name as existing
  - Expected: Error message or warning

- [ ] **Test**: Client name is required field
  - Leave name empty
  - Try to submit
  - Expected: Validation error

#### B.2 List Clients
- [ ] **Test**: All clients display in table
  - Navigate to `/clients`
  - Expected: Client list populated, columns: Name, Email, Phone, Actions

- [ ] **Test**: Empty state message
  - Delete all clients (or new account)
  - Navigate to `/clients`
  - Expected: "No clients yet..." message with Create button

#### B.3 Update Client
- [ ] **Test**: Client information can be updated (if implemented)
  - Edit client details
  - Expected: Changes persisted

#### B.4 Delete Client
- [ ] **Test**: Client deletion
  - Click Delete button
  - Confirm deletion
  - Expected: Client removed from list
  
- [ ] **Test**: Deleting client with invoices
  - Create invoice for client
  - Try to delete client
  - Expected: Either cascade delete or error message

---

### C. Invoice Management

#### C.1 Create Invoice
- [ ] **Test**: Basic invoice creation
  - Navigate to `/invoices`
  - Click "New Invoice"
  - Select client: "Acme Corp"
  - Issue Date: Today
  - Due Date: +30 days
  - Add line: "Services" × 1 @ $1000.00
  - Click "Create Invoice"
  - Expected: Invoice created, appears in list with ID/number

- [ ] **Test**: Invoice numbering is sequential
  - Create 2 invoices
  - Expected: Invoice numbers sequential (INV-001, INV-002, etc.)

- [ ] **Test**: Multiple line items
  - Add 3 different line items
  - Expected: All lines saved correctly

- [ ] **Test**: Line item calculations
  - Qty: 2, Unit Price: $500.00
  - Expected: Line total: $1000.00

#### C.2 GST/HST Calculation
- [ ] **Test**: GST (5%) for Alberta company
  - Create company in Alberta
  - Create invoice with $100 subtotal
  - Expected: GST = $5.00, Total = $105.00

- [ ] **Test**: HST (13%) for Ontario company
  - Create company in Ontario
  - Create invoice with $100 subtotal
  - Expected: HST = $13.00, Total = $113.00

- [ ] **Test**: HST (14%) for Nova Scotia
  - Create company in Nova Scotia
  - Create invoice with $100 subtotal
  - Expected: HST = $14.00, Total = $114.00

- [ ] **Test**: HST (15%) for other provinces
  - Create company in BC/MB/SK/AB
  - Expected: Correct rate applied

- [ ] **Test**: Tax calculation validation
  - Create invoice with multiple line items
  - Manual check: Subtotal × Tax Rate = Tax Amount
  - Expected: Calculation matches

#### C.3 Invoice Display & Status
- [ ] **Test**: Invoice list shows all fields
  - Columns: Invoice #, Client, Date, Total, Paid, Status
  - Expected: All columns populated correctly

- [ ] **Test**: Invoice status badge displays correctly
  - DRAFT: Gray
  - SENT: Blue
  - PARTIAL: Yellow
  - PAID: Green
  - OVERDUE: Red
  - Expected: Correct colors/text

#### C.4 Invoice Details (if implemented)
- [ ] **Test**: Click invoice to view details
  - Navigate to invoice detail page
  - Expected: All invoice info displayed

- [ ] **Test**: PDF download/preview
  - Click "Download PDF"
  - Expected: PDF generated with invoice details

- [ ] **Test**: Email invoice
  - Click "Send via Email"
  - Expected: Email sent to client

#### C.5 Payment Recording
- [ ] **Test**: Record full payment
  - Open invoice (DRAFT status)
  - Record payment = Total amount
  - Expected: Status changes to PAID

- [ ] **Test**: Record partial payment
  - Open invoice
  - Record payment = 50% of total
  - Expected: Status changes to PARTIAL, amount_paid updated

- [ ] **Test**: Record multiple payments
  - Invoice total: $1000
  - Payment 1: $300
  - Payment 2: $400
  - Payment 3: $300
  - Expected: Total paid = $1000, status = PAID

#### C.6 Form Validation
- [ ] **Test**: Client is required
  - Try to submit without selecting client
  - Expected: Error message

- [ ] **Test**: At least one line item required
  - Try to submit with empty lines
  - Expected: Error message

- [ ] **Test**: Line item description required
  - Add line with empty description
  - Try to submit
  - Expected: Error message

- [ ] **Test**: Unit price must be > 0
  - Add line with $0 price
  - Try to submit
  - Expected: Error message

---

### D. Accounting & Reporting

#### D.1 Double-Entry Accounting
- [ ] **Test**: Invoice creates journal entry
  - Create invoice for $1000
  - Backend check: JournalEntry records created
  - Expected: 
    - Debit: Accounts Receivable $1000
    - Credit: Revenue $1000
    - Balanced (total debits = total credits)

- [ ] **Test**: Payment creates journal entry
  - Record $500 payment on invoice
  - Backend check: JournalEntry for payment
  - Expected:
    - Debit: Bank Account $500
    - Credit: Accounts Receivable $500

- [ ] **Test**: Journal entries are immutable
  - Try to edit/delete journal entry (if UI exists)
  - Expected: Not allowed (accounting integrity)

#### D.2 Trial Balance Report
- [ ] **Test**: Trial balance calculates correctly
  - Navigate to Reports → Trial Balance (if available)
  - Expected: 
    - All accounts with balances listed
    - Debit total = Credit total
    - Balanced message displayed

- [ ] **Test**: Trial balance after multiple invoices
  - Create 3 invoices, record 1 payment
  - Check trial balance
  - Expected: 
    - A/R = 2 invoices value
    - Revenue = 3 invoices value
    - Bank = payment amount
    - Balanced

#### D.3 Dashboard KPIs
- [ ] **Test**: Total Income calculation
  - Create invoices totaling $5000
  - Dashboard should show: Total Income = $5000
  - Expected: Matches sum of revenue accounts

- [ ] **Test**: Accounts Receivable
  - 2 paid invoices ($1000 each), 1 unpaid ($2000)
  - Dashboard A/R: $2000
  - Expected: Shows only unpaid amount

- [ ] **Test**: Net Profit
  - Revenue: $5000, Expenses: $1000
  - Dashboard Net Profit: $4000
  - Expected: Revenue - Expenses

- [ ] **Test**: Cash Balance
  - Create invoice for $1000
  - Record $750 payment
  - Dashboard Cash: $750
  - Expected: Shows received payment amount

- [ ] **Test**: Unpaid invoices count
  - Create 3 invoices, pay 1
  - Dashboard shows: "2 unpaid invoices"
  - Expected: Correct count

#### D.4 KPI Real-time Updates
- [ ] **Test**: Dashboard updates after invoice creation
  - Open dashboard
  - Create invoice in another tab
  - Expected: KPIs update without manual refresh (React Query refetch)

- [ ] **Test**: Dashboard updates after payment
  - Create invoice
  - Record payment
  - Expected: A/R decreases, Cash increases

---

### E. UI/UX & Responsive Design

#### E.1 Layout & Navigation
- [ ] **Test**: Dashboard has proper navigation links
  - Dashboard → Invoices link works
  - Dashboard → Clients link works
  - Clients → Dashboard link works
  - Invoices → Dashboard link works

- [ ] **Test**: Responsive design (mobile)
  - Resize browser to 375px width
  - Expected: Layout stacks vertically, all content accessible

- [ ] **Test**: Loading states
  - Navigate between pages
  - Expected: Spinner/loading indicator shown during data fetch

- [ ] **Test**: Error states
  - Simulate API error (network tab)
  - Expected: Error message displayed

#### E.2 Forms & Validation
- [ ] **Test**: Form validation messages
  - Required fields show error on blur
  - Email format validated
  - Expected: Clear error messages

- [ ] **Test**: Button disable state
  - Form submitting
  - Expected: Submit button disabled, shows "Creating..."

- [ ] **Test**: Form persistence (optional)
  - Fill form without submitting
  - Navigate away and back
  - Expected: Form data retained (if implemented)

#### E.3 Tables & Lists
- [ ] **Test**: Table sorting (if implemented)
  - Click column header
  - Expected: Data sorted ascending/descending

- [ ] **Test**: Table pagination (if implemented)
  - Many records displayed
  - Expected: Pagination controls appear

- [ ] **Test**: Empty states
  - No clients exist
  - No invoices exist
  - Expected: Clear message with action button

---

### F. Data Integrity & Security

#### F.1 Multi-tenancy
- [ ] **Test**: Users only see their own data
  - Register 2 separate users (different companies)
  - Create data in account 1
  - Login to account 2
  - Expected: Account 2 sees no account 1 data

- [ ] **Test**: Company isolation in database
  - Backend: All queries filter by company_id
  - Expected: No data leakage between companies

#### F.2 Authorization
- [ ] **Test**: User cannot access other user's resources
  - Get invoice ID from one user
  - Try to access via another user's account
  - Expected: 403 Forbidden (if implemented) or no access

#### F.3 Data Validation
- [ ] **Test**: Negative amounts rejected
  - Try to create invoice with -$100
  - Expected: Rejected or validation error

- [ ] **Test**: Invalid dates rejected
  - Try due date before issue date
  - Expected: Validation error or corrected

- [ ] **Test**: XSS prevention
  - Try to create client with name containing `<script>`
  - Expected: Script escaped, displayed as text

#### F.4 Audit Trail (if implemented)
- [ ] **Test**: Actions are logged
  - Create invoice
  - Backend check: AuditLog entry created
  - Expected: Who, what, when recorded

---

### G. API Contract Testing

These tests verify backend API returns expected structure.

#### G.1 Authentication Endpoints
```
POST /api/auth/register
Expected Response:
{
  "success": true,
  "data": {
    "user": {...},
    "company": {...},
    "token": "eyJ..."
  }
}

POST /api/auth/login
Expected Response:
{
  "success": true,
  "data": {
    "user": {...},
    "company": {...},
    "token": "eyJ..."
  }
}
```

#### G.2 Clients Endpoints
```
GET /api/clients
Expected Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "email": "...",
      "phone": "...",
      "billing_address": "...",
      "company_id": "uuid",
      "created_at": "2026-09-11T..."
    }
  ]
}

POST /api/clients
Body: { "name": "...", "email": "...", "phone": "...", "billing_address": "..." }
Expected: 201 Created with client data
```

#### G.3 Invoices Endpoints
```
POST /api/invoices
Body: {
  "client_id": "uuid",
  "issue_date": "2026-09-11",
  "due_date": "2026-10-11",
  "lines": [
    { "description": "...", "quantity": 1, "unit_price_cents": 100000 }
  ]
}

Expected Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "invoice_number": "INV-1",
    "subtotal_cents": 100000,
    "tax_cents": 5000,
    "total_cents": 105000,
    "status": "DRAFT",
    "client": {...},
    "lines": [...]
  }
}

POST /api/invoices/:id/payments
Body: { "amount_cents": 52500 }
Expected: Invoice updated, payment recorded, status → PARTIAL/PAID
```

#### G.4 Accounting Endpoints
```
GET /api/accounting/trial-balance
Expected Response:
{
  "success": true,
  "data": {
    "accounts": [
      {
        "account_id": "uuid",
        "account_name": "Accounts Receivable",
        "normal_balance": "DEBIT",
        "balance_cents": 50000
      }
    ],
    "total_debits": 200000,
    "total_credits": 200000,
    "balanced": true
  }
}

GET /api/accounting/dashboard/kpis
Expected Response:
{
  "success": true,
  "data": {
    "total_income_cents": 500000,
    "total_expenses_cents": 100000,
    "net_profit_cents": 400000,
    "cash_balance_cents": 375000,
    "accounts_receivable_cents": 125000,
    "accounts_payable_cents": 0,
    "unpaid_invoices": 2,
    "unpaid_bills": 0
  }
}
```

---

## Manual Testing Workflow

### Complete Workflow Test
Follow this sequence to manually test the entire Phase 1 workflow:

1. **Register New Company**
   ```
   Name: Test Company
   Company: Test Inc
   Province: Ontario (HST 13%)
   ```

2. **Create 2 Clients**
   ```
   Client 1: Acme Corp (contact@acme.local)
   Client 2: Beta Inc (contact@beta.local)
   ```

3. **Create 3 Invoices**
   ```
   Invoice 1: Acme Corp, $5000, create date
   Invoice 2: Acme Corp, $3000, create date
   Invoice 3: Beta Inc, $2000, create date
   ```

4. **Record Payments**
   ```
   Invoice 1: Pay full amount ($5000)
   Invoice 2: Pay partial ($1500 of $3000)
   Invoice 3: No payment (unpaid)
   ```

5. **Verify Dashboard KPIs**
   ```
   Total Income: $10,000 (3 invoices)
   Accounts Receivable: $3,500 (unpaid: $1500 + $2000)
   Cash Balance: $6,500 (received payments)
   Net Profit: $10,000 (no expenses in Phase 1)
   Unpaid Invoices: 2
   ```

6. **Verify Trial Balance**
   ```
   Accounts Receivable: Debit $3,500
   Bank Account: Debit $6,500
   Revenue: Credit $10,000
   Total Debits = Total Credits = $10,000
   ```

7. **Verify Data Isolation**
   - Register second user/company
   - Verify first company's data not visible
   - Verify invoices isolated per company

---

## Performance Benchmarks

- [ ] Dashboard loads in < 2 seconds
- [ ] Invoice list loads with 100 records in < 1 second
- [ ] Create invoice completes in < 500ms
- [ ] Trial balance calculation with 1000 entries in < 1 second

---

## Browser Compatibility

- [ ] Chrome 120+
- [ ] Firefox 121+
- [ ] Safari 17+
- [ ] Edge 120+

---

## Accessibility Checklist

- [ ] All form labels associated with inputs
- [ ] Color not only means of information (status badges)
- [ ] Keyboard navigation works (Tab through form)
- [ ] Error messages associated with fields
- [ ] Skip navigation links present (if needed)

---

## Sign-Off

- [ ] All tests in this checklist passed
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Ready for Phase 2

**Status**: Ready for Testing  
**Last Updated**: 2026-09-11  
**Next Phase**: Phase 2 (PDF, Email, OCR, Advanced Reports)
