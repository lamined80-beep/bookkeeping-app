import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { AuthRequest, ApiResponse } from '../types/index.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import { validateEmail, validatePassword, sanitizeInput } from '../utils/validation.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();

// ===== REGISTRATION =====

router.post('/register', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const { email, password, name, company_name, province } = req.body;

    // Validation
    if (!email || !password || !name || !company_name || !province) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password, name, company_name, province',
      });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email address',
      });
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      res.status(400).json({
        success: false,
        error: 'Password does not meet requirements',
        details: passwordValidation.errors,
      });
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'Email already registered',
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create company and user
    const company = await prisma.company.create({
      data: {
        id: uuid(),
        name: sanitizeInput(company_name),
        province,
        country: 'CA',
        currency: 'CAD',
        fiscal_year_start_month: 1,
      },
    });

    const user = await prisma.user.create({
      data: {
        id: uuid(),
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name: sanitizeInput(name),
        company_id: company.id,
        role: UserRole.OWNER,
        is_email_verified: true, // In production, send verification email
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      companyId: user.company_id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        company: {
          id: company.id,
          name: company.name,
          province: company.province,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message,
    });
  }
});

// ===== LOGIN =====

router.post('/login', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password required',
      });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { company: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    // Check if user is active
    if (!user.is_active) {
      res.status(403).json({
        success: false,
        error: 'Account is disabled',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      companyId: user.company_id,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        company: {
          id: user.company.id,
          name: user.company.name,
          province: user.company.province,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

// ===== VERIFY TOKEN =====

router.post('/verify', async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid token',
      });
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { company: true },
    });

    if (!user || !user.is_active) {
      res.status(401).json({
        success: false,
        error: 'User not found or account disabled',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        company: {
          id: user.company.id,
          name: user.company.name,
          province: user.company.province,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Verification failed',
    });
  }
});

// ===== LOGOUT (Client-side, but good practice) =====

router.post('/logout', (req: AuthRequest, res: Response<ApiResponse>) => {
  // Token is stored on client, so just confirm logout
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export { router as authRouter };
