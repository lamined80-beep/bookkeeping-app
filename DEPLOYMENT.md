# Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (optional)
- PostgreSQL 15+ (if not using Docker)

### Setup with Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd bookkeeping-app

# Start all services
docker-compose up

# In a new terminal, initialize the database
docker exec bookkeeping-api npm run db:setup
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Database Admin: http://localhost:8080 (Adminer)

### Manual Setup

```bash
# Backend setup
cd backend
npm install
cp ../.env.example ../.env
npm run db:setup
npm run dev

# Frontend setup (in new terminal)
cd frontend
npm install
npm run dev
```

## Production Deployment

### Option 1: Render.com (Recommended for beginners)

#### 1. Database Setup
1. Create PostgreSQL instance on Render
2. Copy the connection string
3. Set `DATABASE_URL` environment variable

#### 2. Deploy Backend
1. Fork the repository to GitHub
2. On Render dashboard:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Choose the `backend` directory as root
   - Set environment variables:
     ```
     DATABASE_URL=your-postgres-url
     JWT_SECRET=generate-a-secure-random-string
     NODE_ENV=production
     CORS_ORIGIN=your-frontend-url.render.com
     ```
   - Build command: `npm install && npm run db:setup && npm run build`
   - Start command: `npm start`

#### 3. Deploy Frontend
1. On Render dashboard:
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Choose the `frontend` directory as root
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Set environment variables:
     ```
     VITE_API_URL=your-backend-url.render.com
     ```

### Option 2: Railway.app

1. Sign up at railway.app
2. Create new project
3. Connect GitHub repository
4. Add PostgreSQL plugin
5. Configure services:
   - Backend service pointing to `/backend`
   - Frontend service pointing to `/frontend`
6. Set environment variables in Railway dashboard
7. Deploy

### Option 3: Heroku (Paid)

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create apps
heroku create bookkeeping-api-prod
heroku create bookkeeping-ui-prod

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:standard-0 --app bookkeeping-api-prod

# Set environment variables
heroku config:set JWT_SECRET=... --app bookkeeping-api-prod

# Deploy
git push heroku main
```

## Environment Variables

### Backend (.env)
```
# Database
DATABASE_URL="postgresql://user:password@host:5432/bookkeeping"

# Authentication
JWT_SECRET="min-32-characters-long-random-string"
JWT_EXPIRY="7d"

# Server
NODE_ENV="production"
PORT=5000

# CORS
CORS_ORIGIN="https://your-frontend-url.com"

# Storage
STORAGE_TYPE="s3"  # or "local"
# S3 configuration if using S3

# Optional
SENTRY_DSN="your-sentry-dsn"
```

### Frontend (.env)
```
VITE_API_URL="https://your-api-url.com"
VITE_APP_NAME="Bookkeeping"
```

## Database Migrations

After deploying a new version with database schema changes:

```bash
# On production server
npm run db:migrate

# Or with Prisma CLI
npx prisma migrate deploy
```

## Backup Strategy

### Automated Daily Backups
Most cloud PostgreSQL providers (Render, Railway) include automatic daily backups.

### Manual Backup
```bash
# Backup database
pg_dump $DATABASE_URL > bookkeeping_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < bookkeeping_backup.sql
```

## Monitoring & Logging

### Sentry Integration
1. Create Sentry account at sentry.io
2. Create new project for Node.js
3. Set `SENTRY_DSN` environment variable
4. Errors will be tracked automatically

### Log Monitoring
- Render.com: View logs in dashboard
- Railway.app: Real-time logs in dashboard
- Heroku: `heroku logs --tail --app bookkeeping-api-prod`

## SSL/TLS Certificates

All cloud platforms (Render, Railway, Heroku) provide automatic SSL certificates.

## Custom Domain

### Render.com
- Dashboard → Settings → Custom Domains
- Add your domain
- Update DNS records per Render's instructions

### Railway.app
- Project Settings → Domains
- Add custom domain
- Update DNS CNAME record

### Heroku
```bash
heroku domains:add your-domain.com --app bookkeeping-api-prod
```

## Performance Optimization

### Frontend
- Vite build automatically optimizes:
  - Code splitting
  - Tree shaking
  - Minification
- Enable gzip compression in web server

### Backend
- Database indexes on frequently queried columns
- Connection pooling (Prisma handles this)
- Caching layer (optional - Redis)

### Database
- Query optimization
- Regular VACUUM and ANALYZE
- Backup verification

## Disaster Recovery

### Restore from Backup
1. Create new PostgreSQL instance
2. Restore database dump
3. Update `DATABASE_URL`
4. Restart backend service
5. Verify data integrity:
   ```bash
   npm run verify:database
   ```

## Security Checklist

- [ ] Change `JWT_SECRET` to random 32+ character string
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (automatic on cloud providers)
- [ ] Set `CORS_ORIGIN` to specific frontend URL
- [ ] Regular security updates
- [ ] Database backups verified
- [ ] Audit logs enabled
- [ ] Rate limiting configured
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS protection (React + escaping)

## Troubleshooting

### Database connection errors
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Frontend not connecting to API
- Verify `VITE_API_URL` is correct
- Check CORS settings on backend
- Verify both services are running

### Application not starting
```bash
# View logs
heroku logs --tail
# or
railway logs

# Check environment variables
heroku config
```

## Support

For issues:
1. Check logs in cloud provider dashboard
2. Verify environment variables
3. Test database connectivity
4. Review error messages in Sentry
5. Open GitHub issue with error details

## Rollback Procedure

If deployment causes issues:

1. Render.com:
   - Dashboard → Deployments
   - Select previous deployment
   - Click "Redeploy"

2. Railway.app:
   - Deployments tab
   - Select previous version
   - Redeploy

3. Heroku:
   ```bash
   heroku releases --app bookkeeping-api-prod
   heroku releases:rollback v123 --app bookkeeping-api-prod
   ```

## Costs Estimate (Monthly)

- Render.com: ~$50-100 (PostgreSQL + API + Frontend)
- Railway.app: Pay-as-you-go, typically $10-50
- Heroku: Minimum $7 (PaaS surcharge) + database costs
- AWS/GCP/Azure: Variable, typically $50+

Choose based on your expected traffic and budget.
