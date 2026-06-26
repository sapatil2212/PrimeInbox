# PrimeInbox

**PrimeInbox** is an advanced Email Outreach SaaS built for scale, performance, and seamless user experiences.

> **Copyright Claims**
>
> © 2026 SAP TechnoEditors & DigiGrowNex Technologies. All rights reserved.
> **Code belongs to the SAP TechnoEditors & DigiGrowNex Technologies.**

---

## Architecture Overview

PrimeInbox consists of two main components:
1. **Frontend (`/email-outreach`)**: A Next.js 14+ application providing the user dashboard, authentication, campaign management, and API routes.
2. **Backend (`/backend`)**: A Node.js worker process that handles scheduling and dispatching emails efficiently using `setTimeout`-based dispatch to eliminate Redis/BullMQ dependencies.

---

## Local Setup Guide

### Prerequisites
- Node.js (v18 or higher recommended)
- MariaDB or MySQL database

### 1. Database & Environment Setup
Clone the repository:
```bash
git clone https://github.com/sapatil2212/PrimeInbox.git
cd PrimeInbox
```

Configure your environment variables for the frontend:
```bash
cd email-outreach
cp .env.example .env
```
Edit `.env` and fill in your `DATABASE_URL` (pointing to your MariaDB/MySQL instance) and other necessary keys (JWT_SECRET, etc.).

### 2. Frontend Installation & Setup
From the `email-outreach` directory:
```bash
# Install dependencies
npm install

# Push the Prisma schema to your database
npx prisma db push

# (Optional) Seed the database if you have a seed script
# npx prisma db seed

# Run the Next.js development server
npm run dev
```
The frontend will be available at `http://localhost:3000`.

### 3. Backend Worker Installation & Setup
Open a new terminal window and navigate to the backend directory:
```bash
cd ../backend

# Install backend dependencies
npm install

# Generate the Prisma client (uses the schema from the frontend)
npm run prisma:generate

# Run the backend worker in development mode
npm run dev
```
The backend will automatically pick up campaigns with a `RUNNING` status and dispatch emails based on the configured anti-spam delays.

---

## Deployment Guide

### Frontend Deployment (Vercel)
Vercel is the optimal platform for deploying the Next.js frontend of PrimeInbox.

1. Push your code to GitHub.
2. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import the `PrimeInbox` repository.
4. **Important configuration during import:**
   - **Root Directory:** Set this to `email-outreach` (since the Next.js app is inside this folder).
   - **Framework Preset:** Next.js.
5. Add your Environment Variables (copy them from your local `.env`).
6. Click **Deploy**. Vercel will automatically build and deploy the frontend.

### Backend Deployment (VPS - Ubuntu/Debian)
Since the backend uses a long-running Node.js worker, it should be deployed on a VPS (like DigitalOcean, AWS EC2, or Hetzner) using **PM2**.

1. **SSH into your VPS** and install dependencies:
   ```bash
   sudo apt update
   sudo apt install nodejs npm git -y
   sudo npm install -g pm2
   ```

2. **Clone the repository:**
   ```bash
   git clone https://github.com/sapatil2212/PrimeInbox.git
   cd PrimeInbox
   ```

3. **Set up the Environment:**
   Create the `.env` file in the `email-outreach` directory so the Prisma client knows how to connect to the database.
   ```bash
   cd email-outreach
   nano .env # Add your DATABASE_URL here
   ```

4. **Install & Build the Backend:**
   ```bash
   cd ../backend
   npm install
   npm run prisma:generate
   npm run build
   ```

5. **Start with PM2 using the Ecosystem file:**
   Assuming you have an `ecosystem.config.js` at the root of your project:
   ```bash
   cd ..
   pm2 start ecosystem.config.js
   
   # Ensure PM2 restarts on server reboot
   pm2 startup
   pm2 save
   ```

Your backend worker is now running in the background, managed by PM2, and your frontend is live on Vercel!

---
*PrimeInbox - Empowering your email outreach.*
