import { PrismaClient, AccountType, DebitCredit, ExpenseStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient();

const EXPENSE_CATEGORIES = [
  { name: 'Cleaning supplies', tax_recoverable: true },
  { name: 'Equipment', tax_recoverable: true },
  { name: 'Repairs and maintenance', tax_recoverable: true },
  { name: 'Subcontractors', tax_recoverable: true },
  { name: 'Insurance', tax_recoverable: false },
  { name: 'Advertising', tax_recoverable: true },
  { name: 'Software', tax_recoverable: true },
  { name: 'Professional fees', tax_recoverable: true },
  { name: 'Vehicle expenses', tax_recoverable: true },
  { name: 'Office expenses', tax_recoverable: true },
  { name: 'Rent and utilities', tax_recoverable: true },
  { name: 'Bank charges', tax_recoverable: false },
  { name: 'Office supplies', tax_recoverable: true },
  { name: 'Telephone', tax_recoverable: true },
  { name: 'Travel', tax_recoverable: true },
  { name: 'Meals and entertainment', tax_recoverable: false },
  { name: 'Office equipment', tax_recoverable: true },
  { name: 'Fuel', tax_recoverable: true },
  { name: 'Training', tax_recoverable: true },
  { name: 'Other operating expenses', tax_recoverable: true },
];

// Canadian standard chart of accounts
const CHART_OF_ACCOUNTS = [
  // Assets
  { number: '1000', name: 'Cash', type: AccountType.ASSET, balance: DebitCredit.DEBIT },
  { number: '1010', name: 'Chequing Account', type: AccountType.ASSET, balance: DebitCredit.DEBIT },
  { number: '1020', name: 'Savings Account', type: AccountType.ASSET, balance: DebitCredit.DEBIT },
  { number: '1030', name: 'Credit Card Account', type: AccountType.ASSET, balance: DebitCredit.DEBIT },
  { number: '1100', name: 'Accounts Receivable', type: AccountType.ASSET, balance: DebitCredit.DEBIT },
  { number: '1200', name: 'Equipment', type: AccountType.ASSET, balance: DebitCredit.DEBIT },
  { number: '1210', name: 'Accumulated Depreciation - Equipment', type: AccountType.ASSET, balance: DebitCredit.CREDIT },

  // Liabilities
  { number: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY, balance: DebitCredit.CREDIT },
  { number: '2100', name: 'GST/HST Payable', type: AccountType.LIABILITY, balance: DebitCredit.CREDIT },
  { number: '2110', name: 'GST/HST Recoverable (Input Tax Credit)', type: AccountType.LIABILITY, balance: DebitCredit.DEBIT },
  { number: '2200', name: 'Income Tax Payable', type: AccountType.LIABILITY, balance: DebitCredit.CREDIT },
  { number: '2300', name: 'Payroll Payable', type: AccountType.LIABILITY, balance: DebitCredit.CREDIT },

  // Equity
  { number: '3000', name: 'Owner Equity', type: AccountType.EQUITY, balance: DebitCredit.CREDIT },
  { number: '3100', name: 'Retained Earnings', type: AccountType.EQUITY, balance: DebitCredit.CREDIT },
  { number: '3200', name: 'Drawings', type: AccountType.EQUITY, balance: DebitCredit.DEBIT },

  // Revenue
  { number: '4000', name: 'Service Revenue', type: AccountType.REVENUE, balance: DebitCredit.CREDIT },
  { number: '4010', name: 'Product Sales', type: AccountType.REVENUE, balance: DebitCredit.CREDIT },
  { number: '4020', name: 'Consulting Revenue', type: AccountType.REVENUE, balance: DebitCredit.CREDIT },
  { number: '4030', name: 'Other Income', type: AccountType.REVENUE, balance: DebitCredit.CREDIT },

  // Expenses
  { number: '5000', name: 'Cleaning supplies', type: AccountType.EXPENSE, balance: DebitCredit.DEBIT },
  { number: '5010', name: 'Equipment', type: AccountType.EXPENSE, balance: DebitCredit.DEBIT },
  { number: '5020', name: 'Repairs and maintenance', type: AccountType.EXPENSE, balance: DebitCredit.DEBIT },
  { number: '5030', name: 'Subcontractors', type: AccountType.EXPENSE, balance: DebitCredit.DEBIT },
  { number: '5040', name: 'Insurance', type: AccountType.EXPENSE, balance: DebitCredit.DEBIT },
  { number: '5050', name: 'Advertising', type: AccountType.EXPENSE, balance: DebitCredit.DEBIT },
  { number: '5060', name: 'Software and subscriptions', type: AccountType.EXPENSE, balance: DebitCredit.DEBIT },
  { number: '5070', name: 'Professional fees', type: AccountType.EXPENSE, balance: DebitCredit.DEBIT },
  { number: '5080', name: 'Vehicle expenses', type: AccountType.EXPENSE, balance: DebitCredit.DEBIT },
  { number: '5090', name: 'Office expenses', type: AccountType.EXPENSE, balance: DebitCredit.DEBIT },
  { number: '5100', name: 'Rent and utilities', type: AccountType.EXPENSE, balance: DebitCredit.DEBIT },
  { number: '5110', name: 'Bank charges', type: AccountType.EXPENSE, balance: DebitCredit.DEBIT },
  { number: '5120', name: 'Travel', type: AccountType.EXPENSE, balance: DebitCredit.DEBIT },
  { number: '5130', name: 'Meals and entertainment', type: AccountType.EXPENSE, balance: DebitCredit.DEBIT },
  { number: '5140', name: 'Depreciation', type: AccountType.EXPENSE, balance: DebitCredit.DEBIT },
];

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // Create demo company
    const company = await prisma.company.create({
      data: {
        id: uuid(),
        name: 'Demo Company',
        business_number: '123456789RC0001',
        country: 'CA',
        province: 'AB', // Alberta
        fiscal_year_start_month: 1,
        currency: 'CAD',
        gst_hst_registered: true,
        gst_hst_number: '123456789RT0001',
        gst_hst_rate: 5, // GST in Alberta
        invoice_prefix: 'INV',
        next_invoice_number: 1001,
        invoice_payment_terms: 'Net 30',
      },
    });

    console.log(`✅ Created company: ${company.name}`);

    // Create demo user (owner)
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        id: uuid(),
        email: 'demo@bookkeeping.local',
        password_hash: passwordHash,
        name: 'Demo Owner',
        company_id: company.id,
        role: UserRole.OWNER,
        is_email_verified: true,
      },
    });

    console.log(`✅ Created user: ${user.email}`);

    // Create expense categories
    const categories = await Promise.all(
      EXPENSE_CATEGORIES.map((cat) =>
        prisma.expenseCategory.create({
          data: {
            id: uuid(),
            company_id: company.id,
            name: cat.name,
            tax_recoverable: cat.tax_recoverable,
          },
        })
      )
    );

    console.log(`✅ Created ${categories.length} expense categories`);

    // Create chart of accounts
    const accounts = await Promise.all(
      CHART_OF_ACCOUNTS.map((acc) =>
        prisma.chartOfAccount.create({
          data: {
            id: uuid(),
            company_id: company.id,
            account_number: acc.number,
            account_name: acc.name,
            account_type: acc.type,
            normal_balance: acc.balance,
            is_active: true,
          },
        })
      )
    );

    console.log(`✅ Created ${accounts.length} chart of accounts`);

    // Create demo bank account
    const bankAccount = await prisma.bankAccount.create({
      data: {
        id: uuid(),
        company_id: company.id,
        account_name: 'Main Chequing',
        account_number: '****5678',
        bank_name: 'Royal Bank of Canada',
        opening_balance_cents: 500000, // $5,000
        opening_date: new Date('2024-01-01'),
        coa_account_id: accounts.find((a) => a.account_number === '1010')!.id,
      },
    });

    console.log(`✅ Created bank account: ${bankAccount.account_name}`);

    // Create demo client
    const client = await prisma.client.create({
      data: {
        id: uuid(),
        company_id: company.id,
        name: 'Acme Corporation',
        email: 'contact@acmecorp.example.com',
        phone: '403-555-0100',
        billing_address: '123 Main St, Calgary, AB T2P 1M1',
      },
    });

    console.log(`✅ Created client: ${client.name}`);

    // Create demo supplier
    const supplier = await prisma.supplier.create({
      data: {
        id: uuid(),
        company_id: company.id,
        name: 'Office Depot Canada',
        email: 'orders@officedepot.ca',
        phone: '1-800-555-0123',
        billing_address: '456 Supply Ave, Toronto, ON M5V 3A8',
      },
    });

    console.log(`✅ Created supplier: ${supplier.name}`);

    console.log('\n✨ Database seeding complete!');
    console.log(`\nDemo credentials:`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: password123`);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
