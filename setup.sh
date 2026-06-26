#!/bin/bash
# ================================================
# PrimeInbox — VPS Deployment Setup Script
# © 2026 SAP TechnoEditors & DigiGrowNex Technologies
# ================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/email-outreach"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "🚀 PrimeInbox — Starting VPS deployment setup..."
echo "   Project root: $PROJECT_ROOT"

# Check .env exists
if [ ! -f "$FRONTEND_DIR/.env" ]; then
  echo "❌ Missing $FRONTEND_DIR/.env"
  echo "   Copy the example and fill in your values:"
  echo "   cp $FRONTEND_DIR/.env.example $FRONTEND_DIR/.env"
  echo "   nano $FRONTEND_DIR/.env"
  exit 1
fi

# 1. Install dependencies for both frontend and backend
echo ""
echo "📦 Step 1/5: Installing dependencies..."
(cd "$FRONTEND_DIR" && npm install)
(cd "$BACKEND_DIR" && npm install)

# 2. Generate Prisma client for both
echo ""
echo "🔧 Step 2/5: Generating Prisma clients..."
(cd "$FRONTEND_DIR" && npx prisma generate)
(cd "$BACKEND_DIR" && npm run prisma:generate)

# 3. Push database schema
echo ""
echo "🗄️ Step 3/5: Syncing database schema..."
(cd "$FRONTEND_DIR" && npx prisma db push)

# 4. Build frontend (Next.js)
echo ""
echo "🏗️ Step 4/5: Building Next.js frontend..."
(cd "$FRONTEND_DIR" && npm run build)

# 5. Build backend (TypeScript compilation)
echo ""
echo "🏗️ Step 5/5: Building backend worker..."
(cd "$BACKEND_DIR" && npm run build)

echo ""
echo "✅ PrimeInbox deployment build complete!"
echo ""
echo "To start the application with PM2:"
echo "  cd $PROJECT_ROOT"
echo "  pm2 start ecosystem.config.js"
echo ""
echo "To enable auto-start on reboot:"
echo "  pm2 startup"
echo "  pm2 save"
echo ""
echo "🌐 Frontend: http://your-server-ip:3000"
echo "⚙️  Backend worker runs automatically in the background."
