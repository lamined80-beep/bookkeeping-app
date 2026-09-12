import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, ApiResponse } from '../types/index.js';

const router = Router();
const prisma = new PrismaClient();

// GET company info
router.get('/', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
    });

    res.json({
      success: true,
      data: company,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// UPDATE company info
router.put('/', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const company = await prisma.company.update({
      where: { id: req.user.companyId },
      data: req.body,
    });

    res.json({
      success: true,
      data: company,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export { router as companyRouter };
