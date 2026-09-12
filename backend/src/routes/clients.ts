import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { AuthRequest, ApiResponse } from '../types/index.js';
import { sanitizeInput } from '../utils/validation.js';

const router = Router();
const prisma = new PrismaClient();

// GET all clients
router.get('/', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const clients = await prisma.client.findMany({
      where: { company_id: req.user.companyId },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: clients,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single client
router.get('/:id', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        invoices: { orderBy: { created_at: 'desc' }, take: 10 },
        estimates: { orderBy: { created_at: 'desc' }, take: 10 },
      },
    });

    if (!client || client.company_id !== req.user.companyId) {
      res.status(404).json({ success: false, error: 'Client not found' });
      return;
    }

    res.json({ success: true, data: client });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE client
router.post('/', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { name, email, phone, billing_address, service_address, tax_id } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: 'Client name is required' });
      return;
    }

    // Check for duplicate
    const existing = await prisma.client.findUnique({
      where: {
        company_id_name: {
          company_id: req.user.companyId,
          name,
        },
      },
    });

    if (existing) {
      res.status(409).json({ success: false, error: 'Client with this name already exists' });
      return;
    }

    const client = await prisma.client.create({
      data: {
        id: uuid(),
        company_id: req.user.companyId,
        name: sanitizeInput(name),
        email,
        phone,
        billing_address,
        service_address,
        tax_id,
      },
    });

    res.status(201).json({ success: true, data: client });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE client
router.put('/:id', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const existing = await prisma.client.findUnique({
      where: { id: req.params.id },
    });

    if (!existing || existing.company_id !== req.user.companyId) {
      res.status(404).json({ success: false, error: 'Client not found' });
      return;
    }

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.name && { name: sanitizeInput(req.body.name) }),
        ...(req.body.email && { email: req.body.email }),
        ...(req.body.phone && { phone: req.body.phone }),
        ...(req.body.billing_address && { billing_address: req.body.billing_address }),
        ...(req.body.service_address && { service_address: req.body.service_address }),
        ...(req.body.tax_id && { tax_id: req.body.tax_id }),
      },
    });

    res.json({ success: true, data: client });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE client
router.delete('/:id', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const existing = await prisma.client.findUnique({
      where: { id: req.params.id },
    });

    if (!existing || existing.company_id !== req.user.companyId) {
      res.status(404).json({ success: false, error: 'Client not found' });
      return;
    }

    // Check for invoices/estimates
    const invoiceCount = await prisma.invoice.count({
      where: { client_id: req.params.id },
    });

    if (invoiceCount > 0) {
      res.status(409).json({
        success: false,
        error: 'Cannot delete client with existing invoices',
      });
      return;
    }

    await prisma.client.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: 'Client deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as clientRouter };
