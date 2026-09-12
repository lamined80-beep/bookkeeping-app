import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { AuthRequest, ApiResponse } from '../types/index.js';

const router = Router();
const prisma = new PrismaClient();

// GET all estimates
router.get('/', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const estimates = await prisma.estimate.findMany({
      where: { company_id: req.user.companyId },
      include: { client: true, lines: true },
      orderBy: { issue_date: 'desc' },
    });

    res.json({ success: true, data: estimates });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET estimate
router.get('/:id', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const estimate = await prisma.estimate.findUnique({
      where: { id: req.params.id },
      include: { client: true, lines: true },
    });

    if (!estimate || estimate.company_id !== req.user.companyId) {
      res.status(404).json({ success: false, error: 'Estimate not found' });
      return;
    }

    res.json({ success: true, data: estimate });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE estimate
router.post('/', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { client_id, issue_date, expiry_date, notes, lines } = req.body;

    if (!client_id || !issue_date || !lines) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const subtotalCents = lines.reduce(
      (sum: number, line: any) => sum + Math.round(line.quantity * line.unit_price_cents),
      0
    );

    const estimate = await prisma.estimate.create({
      data: {
        id: uuid(),
        company_id: req.user.companyId,
        client_id,
        estimate_number: `EST-${Date.now()}`,
        issue_date: new Date(issue_date),
        expiry_date: expiry_date ? new Date(expiry_date) : null,
        status: 'DRAFT',
        subtotal_cents: subtotalCents,
        tax_cents: 0,
        total_cents: subtotalCents,
        notes,
        lines: {
          create: lines.map((line: any, i: number) => ({
            id: uuid(),
            description: line.description,
            quantity: line.quantity,
            unit_price_cents: line.unit_price_cents,
            line_total_cents: Math.round(line.quantity * line.unit_price_cents),
          })),
        },
      },
      include: { client: true, lines: true },
    });

    res.status(201).json({ success: true, data: estimate });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as estimateRouter };
