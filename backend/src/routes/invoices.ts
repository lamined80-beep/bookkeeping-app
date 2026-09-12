import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { AuthRequest, ApiResponse } from '../types/index.js';

const router = Router();
const prisma = new PrismaClient();

// Helper: Calculate GST/HST for company
async function calculateTax(companyId: string, subtotalCents: number): Promise<number> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company || !company.gst_hst_registered) {
    return 0;
  }

  return Math.round(subtotalCents * (company.gst_hst_rate / 100));
}

// Helper: Create automatic journal entry for invoice
async function createInvoiceJournalEntry(
  invoice: any,
  company: any,
  userId: string
): Promise<void> {
  const arAccount = await prisma.chartOfAccount.findFirst({
    where: {
      company_id: company.id,
      account_number: '1100', // A/R
    },
  });

  const revenueAccount = await prisma.chartOfAccount.findFirst({
    where: {
      company_id: company.id,
      account_number: '4000', // Service Revenue
    },
  });

  const taxAccount = await prisma.chartOfAccount.findFirst({
    where: {
      company_id: company.id,
      account_number: '2100', // GST/HST Payable
    },
  });

  if (!arAccount || !revenueAccount || !taxAccount) {
    throw new Error('Required chart of accounts not found');
  }

  // Create journal entry
  const journalEntry = await prisma.journalEntry.create({
    data: {
      id: uuid(),
      company_id: company.id,
      entry_date: invoice.issue_date,
      description: `Invoice #${invoice.invoice_number} from ${invoice.client.name}`,
      entry_type: 'AUTO_INVOICE',
      reference_id: invoice.id,
      posted_by_id: userId,
      is_posted: true,
      posted_at: new Date(),
      lines: {
        create: [
          {
            id: uuid(),
            account_id: arAccount.id,
            debit_cents: invoice.total_cents,
            credit_cents: null,
            description: `Accounts Receivable - ${invoice.client.name}`,
            position: 1,
          },
          {
            id: uuid(),
            account_id: revenueAccount.id,
            debit_cents: null,
            credit_cents: invoice.subtotal_cents,
            description: `Service Revenue`,
            position: 2,
          },
          ...(invoice.gst_hst_cents > 0
            ? [
                {
                  id: uuid(),
                  account_id: taxAccount.id,
                  debit_cents: null,
                  credit_cents: invoice.gst_hst_cents,
                  description: `GST/HST Collected`,
                  position: 3,
                },
              ]
            : []),
        ],
      },
    },
  });

  return;
}

// Helper: Create journal entry for payment
async function createPaymentJournalEntry(
  invoice: any,
  paymentCents: number,
  company: any,
  userId: string
): Promise<void> {
  const cashAccount = await prisma.chartOfAccount.findFirst({
    where: {
      company_id: company.id,
      account_number: '1010', // Chequing
    },
  });

  const arAccount = await prisma.chartOfAccount.findFirst({
    where: {
      company_id: company.id,
      account_number: '1100', // A/R
    },
  });

  if (!cashAccount || !arAccount) {
    throw new Error('Required chart of accounts not found');
  }

  await prisma.journalEntry.create({
    data: {
      id: uuid(),
      company_id: company.id,
      entry_date: new Date(),
      description: `Payment received for Invoice #${invoice.invoice_number}`,
      entry_type: 'AUTO_PAYMENT',
      reference_id: invoice.id,
      posted_by_id: userId,
      is_posted: true,
      posted_at: new Date(),
      lines: {
        create: [
          {
            id: uuid(),
            account_id: cashAccount.id,
            debit_cents: paymentCents,
            credit_cents: null,
            description: `Cash received - ${invoice.client.name}`,
            position: 1,
          },
          {
            id: uuid(),
            account_id: arAccount.id,
            debit_cents: null,
            credit_cents: paymentCents,
            description: `A/R payment - ${invoice.client.name}`,
            position: 2,
          },
        ],
      },
    },
  });
}

// GET all invoices
router.get('/', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const invoices = await prisma.invoice.findMany({
      where: { company_id: req.user.companyId },
      include: { client: true, lines: true },
      orderBy: { issue_date: 'desc' },
    });

    res.json({ success: true, data: invoices });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET invoice by ID
router.get('/:id', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { client: true, lines: true, payments: true },
    });

    if (!invoice || invoice.company_id !== req.user.companyId) {
      res.status(404).json({ success: false, error: 'Invoice not found' });
      return;
    }

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE invoice
router.post('/', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { client_id, issue_date, due_date, payment_terms, notes, lines } = req.body;

    if (!client_id || !issue_date || !lines || lines.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: client_id, issue_date, lines',
      });
      return;
    }

    // Get company
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
    });

    if (!company) {
      res.status(404).json({ success: false, error: 'Company not found' });
      return;
    }

    // Calculate totals
    const subtotalCents = lines.reduce(
      (sum: number, line: any) =>
        sum + Math.round(line.quantity * line.unit_price_cents),
      0
    );

    const taxCents = await calculateTax(req.user.companyId, subtotalCents);
    const totalCents = subtotalCents + taxCents;

    // Get next invoice number
    const invoiceNumber = `${company.invoice_prefix}-${company.next_invoice_number}`;

    // Create invoice with lines
    const invoice = await prisma.invoice.create({
      data: {
        id: uuid(),
        company_id: req.user.companyId,
        client_id,
        invoice_number: invoiceNumber,
        issue_date: new Date(issue_date),
        due_date: new Date(due_date || issue_date),
        status: 'DRAFT',
        subtotal_cents: subtotalCents,
        gst_hst_cents: taxCents,
        other_tax_cents: 0,
        total_cents: totalCents,
        payment_terms: payment_terms || company.invoice_payment_terms,
        notes,
        lines: {
          create: lines.map((line: any, index: number) => ({
            id: uuid(),
            description: line.description,
            quantity: line.quantity,
            unit_price_cents: line.unit_price_cents,
            line_total_cents: Math.round(line.quantity * line.unit_price_cents),
            position: index,
          })),
        },
      },
      include: { client: true, lines: true },
    });

    // Update next invoice number
    await prisma.company.update({
      where: { id: req.user.companyId },
      data: { next_invoice_number: company.next_invoice_number + 1 },
    });

    // Create automatic journal entry
    await createInvoiceJournalEntry(invoice, company, req.user.userId);

    res.status(201).json({ success: true, data: invoice });
  } catch (error: any) {
    console.error('Invoice creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// RECORD PAYMENT
router.post('/:id/payments', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { amount_cents, payment_date, payment_method, reference } = req.body;

    if (!amount_cents) {
      res.status(400).json({ success: false, error: 'Payment amount is required' });
      return;
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { client: true },
    });

    if (!invoice || invoice.company_id !== req.user.companyId) {
      res.status(404).json({ success: false, error: 'Invoice not found' });
      return;
    }

    // Record payment
    const payment = await prisma.paymentReceived.create({
      data: {
        id: uuid(),
        invoice_id: req.params.id,
        amount_cents,
        payment_date: new Date(payment_date || new Date()),
        payment_method: payment_method || 'other',
        reference,
      },
    });

    // Update invoice amounts
    const newAmountPaid = invoice.amount_paid_cents + amount_cents;
    const newStatus =
      newAmountPaid >= invoice.total_cents
        ? 'PAID'
        : newAmountPaid > 0
          ? 'PARTIAL'
          : 'UNPAID';

    const updatedInvoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        amount_paid_cents: newAmountPaid,
        status: newStatus,
      },
      include: { payments: true },
    });

    // Get company for journal entry
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
    });

    if (company) {
      await createPaymentJournalEntry(invoice, amount_cents, company, req.user.userId);
    }

    res.json({
      success: true,
      data: { payment, invoice: updatedInvoice },
    });
  } catch (error: any) {
    console.error('Payment recording error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as invoiceRouter };
