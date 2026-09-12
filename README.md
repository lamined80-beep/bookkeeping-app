# Bookkeeping Application

A complete, open-source bookkeeping platform for Canadian small businesses. Features include invoicing, expense tracking, OCR-assisted receipt processing, double-entry accounting, bank reconciliation, and financial reporting.

## Quick Start

### Prerequisites
- Node.js 18+ & npm
- PostgreSQL 15+
- Docker & Docker Compose (optional, for containerization)

### Development Setup

```bash
# 1. Clone and install dependencies
git clone <repo-url>
cd bookkeeping-app

# 2. Create environment files
cp .env.example .env
# Edit .env with your database URL, JWT secret, etc.

# 3. Install dependencies
npm install

# 4. Initialize database
npm run db:setup

# 5. Start development server
npm run dev
```

This starts:
- Backend API: http://localhost:5000
- Frontend: http://localhost:5173

### Docker Setup

```bash
docker-compose up
# Access at http://localhost
```

## Project Structure

```
bookkeeping-app/
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── server.ts
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   └── utils/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── frontend/                 # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── main.tsx
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── styles/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml        # Local development environment
├── .env.example              # Environment template
├── .gitignore
└── README.md
```

## Features (Phase 1 MVP)

- ✅ Email registration & secure authentication
- ✅ Company setup wizard
- ✅ Client management
- ✅ Estimates & invoice creation
- ✅ GST/HST calculation (registered & non-registered)
- ✅ PDF invoice generation
- ✅ Manual payment recording
- ✅ Double-entry accounting journal
- ✅ Trial balance reporting
- ✅ Dashboard with key metrics
- ✅ Role-based access (Owner, Accountant)

## Coming Soon (Phase 2 & 3)

- OCR receipt processing
- Bank statement import & reconciliation
- Expense tracking
- Advanced financial reports
- Mileage tracking
- Backup & restoration

## Deployment

### Render / Railway / Heroku

1. Create a free account
2. Connect your GitHub repository
3. Set environment variables
4. Deploy

See `DEPLOYMENT.md` for detailed instructions.

## Security

- Passwords hashed with bcrypt
- JWT authentication
- HTTPS enforced
- Private document storage
- Audit logging
- Rate limiting on auth endpoints

## Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Contributing

This is a personal learning project. Contributions welcome for:
- Bug fixes
- UI/UX improvements
- Additional Canadian tax jurisdictions
- Performance optimization

## License

MIT

## Support

For issues, questions, or feature requests, open a GitHub issue.

## Disclaimer

This application is provided as-is for educational and small business use. While accounting accuracy is prioritized, you should verify all calculations with a qualified accountant. The developers are not liable for tax non-compliance or accounting errors.

For professional bookkeeping, consider QuickBooks Online, Zoho Books, or consulting with a CPA.
