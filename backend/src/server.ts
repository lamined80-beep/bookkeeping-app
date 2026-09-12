import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { companyRouter } from './routes/company.js';
import { clientRouter } from './routes/clients.js';
import { invoiceRouter } from './routes/invoices.js';
import { estimateRouter } from './routes/estimates.js';
import { expenseRouter } from './routes/expenses.js';
import { accountingRouter } from './routes/accounting.js';

// Load environment variables
config();

const app = express();
const prisma = new PrismaClient();

// Constants
const PORT = parseInt(process.env.PORT || '5000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

// ===== MIDDLEWARE =====

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later',
});

// ===== HEALTH CHECK =====

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// ===== PUBLIC ROUTES (No auth required) =====

app.use('/api/auth', authLimiter, authRouter);

// ===== PROTECTED ROUTES (Auth required) =====

app.use('/api/company', authMiddleware, companyRouter);
app.use('/api/clients', authMiddleware, clientRouter);
app.use('/api/invoices', authMiddleware, invoiceRouter);
app.use('/api/estimates', authMiddleware, estimateRouter);
app.use('/api/expenses', authMiddleware, expenseRouter);
app.use('/api/accounting', authMiddleware, accountingRouter);

// ===== ERROR HANDLING =====

app.use(notFoundHandler);
app.use(errorHandler);

// ===== DATABASE CONNECTION & SERVER START =====

async function startServer() {
  try {
    // Test database connection
    await prisma.$executeRaw`SELECT 1`;
    console.log('✅ Database connected');

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║    🏦 BOOKKEEPING API SERVER STARTED   ║
╠════════════════════════════════════════╣
║                                        ║
║  Environment: ${NODE_ENV.padEnd(30)}║
║  Port: ${PORT}${' '.repeat(31 - PORT.toString().length)}║
║  API URL: ${API_URL}${' '.repeat(26 - API_URL.length)}║
║                                        ║
║  Press CTRL+C to stop                  ║
║                                        ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();

export default app;
export { prisma };
