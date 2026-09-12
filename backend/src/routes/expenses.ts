import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { AuthRequest, ApiResponse } from '../types/index.js';

const router = Router();
const prisma = new PrismaClient();

// GET all expense categories
router.get('/categories', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const categories = await prisma.expenseCategory.findMany({
      where: { company_id: req.user.companyId },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET all expenses
router.get('/', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const expenses = await prisma.expense.findMany({
      where: { company_id: req.user.companyId },
      include: { category: true, supplier: true },
      orderBy: { expense_date: 'desc' },
    });

    res.json({ success: true, data: expenses });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE expense
router.post('/', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { category_id, description, amount_cents, gst_hst_recoverable_cents, expense_date, supplier_id } = req.body;

    if (!category_id || !description || !amount_cents || !expense_date) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
      return;
    }

    const expense = await prisma.expense.create({
      data: {
        id: uuid(),
        company_id: req.user.companyId,
        category_id,
        description,
        amount_cents,
        gst_hst_recoverable_cents: gst_hst_recoverable_cents || 0,
        expense_date: new Date(expense_date),
        supplier_id,
        status: 'DRAFT',
      },
      include: { category: true, supplier: true },
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as expenseRouter };
