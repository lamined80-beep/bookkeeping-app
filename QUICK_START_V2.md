# Bookkeeping App - Quick Start (V2 - Fixed Dependencies)

## ⚠️ What Changed

The original application had incorrect npm package versions that don't exist in the registry. This version has been corrected with verified, working versions:

- `@prisma/client`: `5.6.0` (instead of 5.7.1)
- `prisma`: `5.6.0` (instead of 5.7.1)
- `jsonwebtoken`: `9.0.2` (instead of 9.1.2)
- Removed non-existent `@prisma/cli` package

## 🚀 Installation (On Your Mac)

You already have Node.js and npm installed. Follow these exact steps:

### 1. Clean Up Any Previous Attempts
```bash
cd ~/Downloads/bookkeeping-app
rm -rf backend/node_modules backend/package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
```

### 2. Install Backend Dependencies
```bash
cd ~/Downloads/bookkeeping-app/backend
npm install
```

**This should complete without errors.** If you see errors about missing packages, let me know which package is failing.

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Run Setup Script
```bash
cd ..
./setup.sh
```

This will:
- Check prerequisites ✓
- Set up PostgreSQL with Docker
- Run database migrations
- Seed demo data

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd ~/Downloads/bookkeeping-app/backend
npm run dev
```
You should see: `Server running on http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd ~/Downloads/bookkeeping-app/frontend
npm run dev
```
You should see: `Local: http://localhost:5173`

### 6. Access the App
Open your browser to: **http://localhost:5173**

**Login with:**
- Email: `demo@bookkeeping.local`
- Password: `password123`

## ✨ Features

- ✅ Double-entry accounting with automatic journal entries
- ✅ Invoice management with GST/HST calculation for all Canadian provinces
- ✅ Real-time financial dashboard
- ✅ Client management
- ✅ Multi-tenancy with data isolation
- ✅ JWT authentication

## 📚 Documentation

- `README.md` - Project overview
- `SETUP.md` - Detailed setup guide
- `TESTING_PLAN.md` - 100+ test cases
- `BUILD_STATUS.md` - Phase roadmap

## 🆘 Troubleshooting

### npm install still fails
- Delete node_modules: `rm -rf node_modules package-lock.json`
- Clear npm cache: `npm cache clean --force`
- Try again: `npm install`

### Docker issues
- Make sure Docker Desktop is running
- Check: `docker ps`

### Port already in use
```bash
# Kill process on port 5000 (backend)
lsof -ti :5000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti :5173 | xargs kill -9
```

### Database issues
Reset the database:
```bash
cd backend
npm run db:reset
npm run db:seed
```

---

**Version**: V2 (Fixed Dependencies)  
**Last Updated**: September 11, 2026  
**Status**: Ready to Use ✅
