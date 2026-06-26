#!/bin/bash
# ================================================
# PrimeInbox — VPS Deployment Setup Script
# © 2026 SAP TechnoEditors & DigiGrowNex Technologies
# ================================================

set -e

echo "🚀 PrimeInbox — Starting VPS deployment setup..."

# 1. Install dependencies for both frontend and backend
echo ""
echo "📦 Step 1/5: Installing dependencies..."
cd email-outreach && npm install --production=false && cd ..
cd backend && npm install --production=false && cd ..

# 2. Generate Prisma client for both
echo ""
echo "🔧 Step 2/5: Generating Prisma clients..."
cd email-outreach && npx prisma generate && cd ..
cd backend && npm run prisma:generate && cd ..

# 3. Push database schema (if needed)
echo ""
echo "🗄️ Step 3/5: Syncing database schema..."
cd email-outreach && npx prisma db push --skip-generate && cd ..

# 4. Build frontend (Next.js)
echo ""
echo "🏗️ Step 4/5: Building Next.js frontend..."
cd email-outreach && npm run build && cd ..

# 5. Build backend (TypeScript compilation)
echo ""
echo "🏗️ Step 5/5: Building backend worker..."
cd backend && npm run build && cd ..

echo ""
echo "✅ PrimeInbox deployment build complete!"
echo ""
echo "To start the application with PM2:"
echo "  pm2 start ecosystem.config.js"
echo ""
echo "To enable auto-start on reboot:"
echo "  pm2 startup"
echo "  pm2 save"
echo ""
echo "🌐 Frontend: http://your-server-ip:3000"
echo "⚙️  Backend worker runs automatically in the background."
