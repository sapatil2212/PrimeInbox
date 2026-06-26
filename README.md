# PrimeInbox

**PrimeInbox** is an advanced Email Outreach SaaS platform built for scale, performance, and seamless user experiences. Manage campaigns, rotate SMTP accounts, track opens/clicks, and automate multi-step email sequences — all from a modern, beautiful dashboard.

> **© 2026 SAP TechnoEditors & DigiGrowNex Technologies. All rights reserved.**  
> **All code in this repository belongs to SAP TechnoEditors & DigiGrowNex Technologies.**  
> Unauthorized reproduction, distribution, or use of this code is strictly prohibited.

---

## Architecture

PrimeInbox is a **monorepo** with two services:

| Service | Directory | Technology | Purpose |
|---------|-----------|------------|---------|
| **Frontend** | `/email-outreach` | Next.js 16 (App Router) | Dashboard UI, API routes, authentication |
| **Backend Worker** | `/backend` | Node.js + TypeScript | Campaign scheduler, email dispatch, SMTP rotation |

Both services share the same **Prisma schema** (located at `email-outreach/prisma/schema.prisma`) and connect to the same **MariaDB/MySQL** database.

---

## Project Structure

```
PrimeInbox/
├── email-outreach/            # Next.js Frontend
│   ├── prisma/
│   │   └── schema.prisma      # Shared database schema
│   ├── src/
│   │   ├── app/               # Pages & API routes
│   │   ├── components/        # UI components
│   │   └── lib/               # Utilities (db, session, etc.)
│   ├── .env.example           # Environment template
│   └── package.json
│
├── backend/                   # Background Worker
│   ├── src/
│   │   ├── config/            # DB, env configuration
│   │   ├── cron/              # Campaign scheduler
│   │   ├── services/          # SMTP rotation, email sender
│   │   └── workers/           # Email dispatch processor
│   └── package.json
│
├── ecosystem.config.js        # PM2 configuration
├── setup.sh                   # One-command VPS deployment script
├── package.json               # Root scripts for monorepo
└── README.md
```

---

## Local Development Setup

### Prerequisites

- **Node.js** v18+ 
- **MariaDB** or **MySQL** database
- **Git**

### Step 1 — Clone & Configure

```bash
git clone https://github.com/sapatil2212/PrimeInbox.git
cd PrimeInbox

# Create environment file
cp email-outreach/.env.example email-outreach/.env
```

Edit `email-outreach/.env` and fill in:
```env
DATABASE_URL="mysql://user:password@localhost:3306/primeinbox"
JWT_SECRET="your-secure-secret-min-32-chars"
ENCRYPTION_KEY="your-64-char-hex-key"
APP_URL="http://localhost:3000"

# Transactional email SMTP (for OTP, password reset, etc.)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="noreply@yourdomain.com"
SMTP_PASS="your-app-password"
SMTP_FROM="PrimeInbox"
```

### Step 2 — Install Dependencies

```bash
# Install everything (frontend + backend)
npm run install:all
```

### Step 3 — Setup Database

```bash
# Push schema to your database
npm run prisma:push

# Generate Prisma clients for both services
npm run prisma:generate
```

### Step 4 — Start Development Servers

Open **two terminal windows**:

**Terminal 1 — Frontend:**
```bash
npm run dev:frontend
# → http://localhost:3000
```

**Terminal 2 — Backend Worker:**
```bash
npm run dev:backend
# → Scheduler starts processing campaigns
```

---

## Deployment

### Option 1 — Vercel (Frontend Only)

Best for deploying the **frontend** (dashboard + API routes).

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import `PrimeInbox`
3. **Settings:**
   - **Root Directory:** `email-outreach`
   - **Framework Preset:** Next.js
4. Add all environment variables from your `.env`
5. Click **Deploy**

> ⚠️ **Important:** The backend worker (email scheduler) cannot run on Vercel. You still need a VPS for the backend. See Option 2 below.

### Option 2 — VPS Deployment (Full Stack)

Deploy **both frontend + backend** on a single VPS (DigitalOcean, AWS EC2, Hetzner, etc.).

#### Prerequisites on VPS
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

#### Deploy PrimeInbox

```bash
# 1. Clone the repository
git clone https://github.com/sapatil2212/PrimeInbox.git
cd PrimeInbox

# 2. Create environment file
cp email-outreach/.env.example email-outreach/.env
nano email-outreach/.env
# Fill in your production DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY, etc.

# 3. Run the deployment script (installs, builds, and prepares everything)
chmod +x setup.sh
bash setup.sh

# 4. Start both services with PM2
pm2 start ecosystem.config.js

# 5. Enable auto-start on reboot
pm2 startup
pm2 save
```

#### Verify Deployment
```bash
# Check running processes
pm2 status

# View frontend logs
pm2 logs primeinbox-frontend

# View backend worker logs
pm2 logs primeinbox-backend
```

#### Nginx Reverse Proxy (Recommended)
```bash
sudo apt install -y nginx
```

Create config at `/etc/nginx/sites-available/primeinbox`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/primeinbox /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### SSL with Certbot (Free HTTPS)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Option 3 — Hybrid (Vercel + VPS)

The recommended production setup:

| Component | Platform | Details |
|-----------|----------|---------|
| Frontend | **Vercel** | Deploy `/email-outreach` as a Next.js app |
| Backend Worker | **VPS** | Run only the backend worker service |
| Database | **PlanetScale / AWS RDS** | Managed MySQL/MariaDB |

On the VPS, for backend-only deployment:
```bash
git clone https://github.com/sapatil2212/PrimeInbox.git
cd PrimeInbox

# Create .env for the backend
cp email-outreach/.env.example email-outreach/.env
nano email-outreach/.env

# Install & build backend only
cd backend
npm install
npm run prisma:generate
npm run build

# Start with PM2
pm2 start dist/index.js --name primeinbox-backend
pm2 startup && pm2 save
```

---

## Available Scripts

Run from the **root directory** (`PrimeInbox/`):

| Script | Description |
|--------|-------------|
| `npm run install:all` | Install dependencies for frontend + backend |
| `npm run prisma:push` | Push schema changes to database |
| `npm run prisma:generate` | Generate Prisma clients for both services |
| `npm run build:all` | Build frontend + backend for production |
| `npm run dev:frontend` | Start Next.js dev server |
| `npm run dev:backend` | Start backend worker in dev mode |
| `npm run deploy` | Full production build (install + generate + build) |
| `npm run start:prod` | Start both services via PM2 |
| `npm run stop:prod` | Stop both services via PM2 |

---

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS, Zustand, Recharts, Framer Motion
- **Backend:** Node.js, TypeScript, Nodemailer
- **Database:** Prisma ORM with MariaDB/MySQL
- **Auth:** JWT sessions with HttpOnly cookies
- **Deployment:** PM2, Nginx, Vercel

---

## License

**Proprietary** — © 2026 SAP TechnoEditors & DigiGrowNex Technologies.  
All rights reserved. This code and its associated intellectual property are the exclusive property of SAP TechnoEditors & DigiGrowNex Technologies. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

---

*PrimeInbox — Empowering your email outreach at scale.*
