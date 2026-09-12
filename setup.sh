#!/bin/bash

# Bookkeeping App Setup Script
# This script sets up the development environment and runs initial tests

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ $1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"
}

print_step() {
    echo -e "${YELLOW}→ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_error "$1 is not installed"
        return 1
    fi
    print_success "$1 is installed"
    return 0
}

# Start setup
print_header "BOOKKEEPING APP - SETUP WIZARD"

# Check prerequisites
print_step "Checking prerequisites..."
check_command "node" || exit 1
check_command "npm" || exit 1
check_command "git" || exit 1

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
print_success "Node.js: $NODE_VERSION"
print_success "npm: $NPM_VERSION"

# Check if .env exists
print_step "Checking environment configuration..."
if [ ! -f ".env" ]; then
    print_error ".env file not found"
    print_step "Please copy .env.example to .env and configure it"
    exit 1
fi
print_success ".env file found"

# Check Docker
print_step "Checking Docker..."
if command -v docker &> /dev/null; then
    print_success "Docker is installed"
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose is installed"
        DOCKER_AVAILABLE=true
    else
        print_error "Docker Compose is not installed"
        DOCKER_AVAILABLE=false
    fi
else
    print_error "Docker is not installed (optional, but recommended)"
    DOCKER_AVAILABLE=false
fi

# Install backend dependencies
print_header "INSTALLING BACKEND DEPENDENCIES"
print_step "Installing backend packages..."
cd backend
npm install
print_success "Backend dependencies installed"

# Install frontend dependencies
print_header "INSTALLING FRONTEND DEPENDENCIES"
print_step "Installing frontend packages..."
cd ../frontend
npm install
print_success "Frontend dependencies installed"

cd ..

# Setup database
print_header "DATABASE SETUP"

if [ "$DOCKER_AVAILABLE" = true ]; then
    print_step "Starting Docker services..."
    docker-compose up -d

    print_step "Waiting for PostgreSQL to be ready..."
    sleep 10

    # Check if database is ready
    max_attempts=30
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker exec bookkeeping-db pg_isready -U bookkeeper &> /dev/null; then
            print_success "PostgreSQL is ready"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 1
    done

    if [ $attempt -eq $max_attempts ]; then
        print_error "PostgreSQL failed to start"
        exit 1
    fi
else
    print_step "Docker not available - assuming PostgreSQL is running locally"
    print_step "Please ensure PostgreSQL is running and DATABASE_URL is configured"
fi

# Run Prisma migrations
print_step "Running database migrations..."
cd backend

# Check if migrations folder exists
if [ ! -d "prisma/migrations" ]; then
    print_step "Creating initial migration..."
    npx prisma migrate dev --name init
else
    print_step "Applying existing migrations..."
    npx prisma migrate deploy
fi

print_success "Database migrations completed"

# Seed database
print_step "Seeding database with demo data..."
npm run db:seed
print_success "Database seeded successfully"

cd ..

# Verify setup
print_header "VERIFYING INSTALLATION"

print_step "Checking backend structure..."
backend_files=(
    "src/server.ts"
    "src/routes/auth.ts"
    "src/routes/clients.ts"
    "src/routes/invoices.ts"
    "src/routes/accounting.ts"
    "src/middleware/auth.ts"
    "prisma/schema.prisma"
)

for file in "${backend_files[@]}"; do
    if [ -f "backend/$file" ]; then
        print_success "$file exists"
    else
        print_error "$file missing"
    fi
done

print_step "Checking frontend structure..."
frontend_files=(
    "src/App.tsx"
    "src/main.tsx"
    "src/services/api.ts"
    "src/hooks/useAuth.tsx"
    "src/pages/LoginPage.tsx"
    "src/pages/DashboardPage.tsx"
    "src/pages/ClientsPage.tsx"
    "src/pages/InvoicesPage.tsx"
)

for file in "${frontend_files[@]}"; do
    if [ -f "frontend/$file" ]; then
        print_success "$file exists"
    else
        print_error "$file missing"
    fi
done

# Final instructions
print_header "SETUP COMPLETE!"

echo -e "${GREEN}Your development environment is ready!${NC}\n"

echo -e "${BLUE}Next Steps:${NC}"
echo -e "1. Start the backend:    cd backend && npm run dev"
echo -e "2. Start the frontend:   cd frontend && npm run dev"
echo -e ""

echo -e "${BLUE}Access Points:${NC}"
echo -e "• Frontend:  http://localhost:5173"
echo -e "• Backend:   http://localhost:5000"
echo -e "• Health:    http://localhost:5000/health"
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo -e "• Database:  http://localhost:8080 (Adminer)"
fi
echo -e ""

echo -e "${BLUE}Demo Credentials:${NC}"
echo -e "• Email:    demo@bookkeeping.local"
echo -e "• Password: password123"
echo -e ""

echo -e "${BLUE}Documentation:${NC}"
echo -e "• See SETUP.md for detailed setup & testing guide"
echo -e "• See BOOKKEEPING_APP_PLAN.md for architecture details"
echo -e "• See BUILD_STATUS.md for current status"
echo -e ""

echo -e "${YELLOW}Docker Services Status:${NC}"
if [ "$DOCKER_AVAILABLE" = true ]; then
    docker-compose ps
else
    echo -e "${YELLOW}Docker not used - verify PostgreSQL is running locally${NC}"
fi
