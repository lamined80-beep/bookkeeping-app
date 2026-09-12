import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, ApiResponse } from '../types/index.js';

const router = Router();
const prisma = new PrismaClient();

// GET trial balance
router.get('/trial-balance', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { from_date, to_date } = req.query;

    // Get all posted journal entries for the company
    const entries = await prisma.journalEntry.findMany({
      where: {
        company_id: req.user.companyId,
        is_posted: true,
        ...(from_date && { entry_date: { gte: new Date(from_date as string) } }),
        ...(to_date && { entry_date: { lte: new Date(to_date as string) } }),
      },
      include: { lines: { include: { account: true } } },
    });

    // Calculate balances by account
    const accountBalances: Record<string, any> = {};

    entries.forEach((entry) => {
      entry.lines.forEach((line) => {
        const accountId = line.account_id;

        if (!accountBalances[accountId]) {
          accountBalances[accountId] = {
            account_id: accountId,
            account_number: line.account.account_number,
            account_name: line.account.account_name,
            account_type: line.account.account_type,
            normal_balance: line.account.normal_balance,
            debit_cents: 0,
            credit_cents: 0,
          };
        }

        if (line.debit_cents) {
          accountBalances[accountId].debit_cents += line.debit_cents;
        }
        if (line.credit_cents) {
          accountBalances[accountId].credit_cents += line.credit_cents;
        }
      });
    });

    // Convert to array and calculate balances
    const trialBalance = Object.values(accountBalances)
      .map((acc: any) => ({
        ...acc,
        balance_cents:
          acc.normal_balance === 'DEBIT'
            ? acc.debit_cents - acc.credit_cents
            : acc.credit_cents - acc.debit_cents,
      }))
      .filter((acc: any) => acc.debit_cents > 0 || acc.credit_cents > 0)
      .sort((a: any, b: any) => a.account_number.localeCompare(b.account_number));

    // Calculate totals
    const totalDebits = trialBalance.reduce((sum, acc: any) => sum + acc.debit_cents, 0);
    const totalCredits = trialBalance.reduce((sum, acc: any) => sum + acc.credit_cents, 0);
    const difference = Math.abs(totalDebits - totalCredits);

    res.json({
      success: true,
      data: {
        trial_balance: trialBalance,
        totals: {
          total_debits: totalDebits,
          total_credits: totalCredits,
          difference: difference,
          is_balanced: difference === 0,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET general ledger for account
router.get('/ledger/:account_id', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const account = await prisma.chartOfAccount.findUnique({
      where: { id: req.params.account_id },
    });

    if (!account || account.company_id !== req.user.companyId) {
      res.status(404).json({ success: false, error: 'Account not found' });
      return;
    }

    // Get all transactions for this account
    const lines = await prisma.journalLine.findMany({
      where: { account_id: req.params.account_id },
      include: {
        journal_entry: true,
      },
      orderBy: { journal_entry: { entry_date: 'asc' } },
    });

    // Calculate running balance
    let runningBalance = 0;
    const transactions = lines.map((line) => {
      const debit = line.debit_cents || 0;
      const credit = line.credit_cents || 0;

      runningBalance +=
        account.normal_balance === 'DEBIT' ? debit - credit : credit - debit;

      return {
        date: line.journal_entry.entry_date,
        description: line.journal_entry.description,
        debit_cents: debit,
        credit_cents: credit,
        balance_cents: runningBalance,
      };
    });

    res.json({
      success: true,
      data: {
        account,
        transactions,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET profit & loss statement
router.get('/reports/profit-loss', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { from_date, to_date } = req.query;

    // Get all posted journal entries
    const entries = await prisma.journalEntry.findMany({
      where: {
        company_id: req.user.companyId,
        is_posted: true,
        ...(from_date && { entry_date: { gte: new Date(from_date as string) } }),
        ...(to_date && { entry_date: { lte: new Date(to_date as string) } }),
      },
      include: { lines: { include: { account: true } } },
    });

    // Group by account type
    const byType: Record<string, any> = {};

    entries.forEach((entry) => {
      entry.lines.forEach((line) => {
        const type = line.account.account_type;

        if (!byType[type]) {
          byType[type] = {};
        }

        const accountNum = line.account.account_number;

        if (!byType[type][accountNum]) {
          byType[type][accountNum] = {
            account_number: accountNum,
            account_name: line.account.account_name,
            total: 0,
          };
        }

        const amount = line.debit_cents || line.credit_cents || 0;
        byType[type][accountNum].total += amount;
      });
    });

    const totalRevenue = Object.values(byType['REVENUE'] || {}).reduce(
      (sum: number, acc: any) => sum + acc.total,
      0
    );

    const totalExpenses = Object.values(byType['EXPENSE'] || {}).reduce(
      (sum: number, acc: any) => sum + acc.total,
      0
    );

    const netProfit = totalRevenue - totalExpenses;

    res.json({
      success: true,
      data: {
        revenue: {
          accounts: Object.values(byType['REVENUE'] || {}),
          total: totalRevenue,
        },
        expenses: {
          accounts: Object.values(byType['EXPENSE'] || {}),
          total: totalExpenses,
        },
        net_profit: netProfit,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET dashboard KPIs
router.get('/dashboard/kpis', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Total income (sum of REVENUE accounts)
    const revenueLines = await prisma.journalLine.findMany({
      where: {
        journal_entry: {
          company_id: req.user.companyId,
          is_posted: true,
        },
        account: {
          account_type: 'REVENUE',
        },
      },
    });

    const totalIncome = revenueLines.reduce(
      (sum, line) => sum + (line.credit_cents || 0),
      0
    );

    // Total expenses (sum of EXPENSE accounts)
    const expenseLines = await prisma.journalLine.findMany({
      where: {
        journal_entry: {
          company_id: req.user.companyId,
          is_posted: true,
        },
        account: {
          account_type: 'EXPENSE',
        },
      },
    });

    const totalExpenses = expenseLines.reduce(
      (sum, line) => sum + (line.debit_cents || 0),
      0
    );

    // Cash balance (from bank account)
    const bankAccounts = await prisma.bankAccount.findMany({
      where: { company_id: req.user.companyId },
    });

    const cashBalance = bankAccounts.reduce((sum, acc) => sum + acc.opening_balance_cents, 0);

    // Unpaid invoices
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        company_id: req.user.companyId,
        status: { in: ['SENT', 'VIEWED', 'PARTIAL', 'OVERDUE'] },
      },
    });

    const arAmount = unpaidInvoices.reduce((sum, inv) => sum + (inv.total_cents - inv.amount_paid_cents), 0);

    // Unpaid bills
    const unpaidBills = await prisma.bill.findMany({
      where: {
        company_id: req.user.companyId,
        status: { in: ['RECEIVED', 'PARTIAL'] },
      },
    });

    const apAmount = unpaidBills.reduce((sum, bill) => sum + (bill.total_cents - bill.amount_paid_cents), 0);

    res.json({
      success: true,
      data: {
        total_income_cents: totalIncome,
        total_expenses_cents: totalExpenses,
        net_profit_cents: totalIncome - totalExpenses,
        cash_balance_cents: cashBalance,
        accounts_receivable_cents: arAmount,
        accounts_payable_cents: apAmount,
        unpaid_invoices: unpaidInvoices.length,
        unpaid_bills: unpaidBills.length,
      },
    });
  } catch (error: any) {
    console.error('KPI error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as accountingRouter };
