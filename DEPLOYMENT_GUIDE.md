# Personal Management System - Ultra-Lightweight Live Deployment Guide

This package is a **Pre-Compiled Standalone Production Build** of the Personal Management System.

### 🌟 Why this solves "Process Limit Exceeded" / "Resource Limit Reached":
- **NO `npm install` on the server**: All needed runtime modules are already pre-bundled in `node_modules/`.
- **NO `next build` on the server**: Everything is compiled into static chunks and optimized server functions.
- **Single Process Execution**: The entire application runs as a **single Node.js process** (`node server.js`), consuming only **~60MB RAM** and **1 Entry Process (EP)**.
- **Cross-Platform Prisma**: Linux engines (`rhel`, `debian`, `centos`, `cloudlinux`) are already included.

---

## 🛑 Step 0: Clear Existing Hanging Processes on Server (Crucial!)

If your hosting is showing "Process Limit Exceeded" or `EAGAIN` errors, previous background processes are still stuck in memory. Clean them first:

### If using cPanel:
1. Go to **cPanel** > **Setup Node.js App**.
2. Click **Stop** on any existing application.
3. If you have SSH / Terminal access in cPanel, run:
   ```bash
   pkill -u $USER -f node
   ```
4. Clear out the old project folder in **File Manager** (keep a backup of old `.db` or uploaded files if needed).

### If using a Linux VPS:
```bash
killall -9 node
# or
pkill -f node
```

---

## 🚀 Option A: Deploy on cPanel (Shared Hosting / CloudLinux)

1. **Upload & Extract**:
   - In cPanel **File Manager**, create a folder (e.g. `personal-management` in your home directory or public_html).
   - Upload `personal-management-software-live.zip` and click **Extract**.

2. **Configure Environment (`.env`)**:
   - Verify the `.env` file exists (in File Manager, ensure "Show Hidden Files" is checked).
   - It contains:
     ```env
     PORT=3000
     NODE_ENV=production
     DATABASE_URL="file:./prisma/prod.db"
     JWT_SECRET="your-secret-key-change-if-desired"
     ```

3. **Configure cPanel "Setup Node.js App"**:
   - Go to **Setup Node.js App** > **Create Application**.
   - **Node.js version**: Choose `18.x`, `20.x`, or `22.x`.
   - **Application mode**: `Production`.
   - **Application root**: Path to your extracted folder (e.g. `personal-management`).
   - **Application startup file**: `server.js`.
   - **Application URL**: Your domain or subdomain.
   - Click **Create**.

4. **Start Application**:
   - Click **Start Application** (or **Restart Application**).
   - Your site is live!

---

## 🚀 Option B: Deploy on Linux VPS (Ubuntu / Debian / CentOS)

1. **Upload & Unzip**:
   ```bash
   mkdir -p /var/www/personal-management
   cd /var/www/personal-management
   # Unzip the uploaded package:
   unzip personal-management-software-live.zip
   ```

2. **Start with PM2 (Recommended)**:
   ```bash
   # Run directly with 1 process:
   pm2 start server.js --name "personal-management"

   # Persist on system boot:
   pm2 save
   pm2 startup
   ```

3. **Nginx Reverse Proxy** (to point your domain to the port):
   ```nginx
   server {
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 💾 Database & Backups
- The SQLite database is located at `./prisma/prod.db`.
- Database migrations and schema are already applied.
- SQLite backups can be downloaded anytime directly from `./prisma/prod.db` or via the workspace backup feature.
