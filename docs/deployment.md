# Deployment Guide — Equipment Rental Management Platform

> Step-by-step guide to deploy the platform on a cloud server (AWS EC2, Azure VM, GCP Compute Engine, DigitalOcean Droplet, or any Linux VPS).

---

## Prerequisites

Your server must have the following installed:

| Tool | Minimum Version | Install Guide |
|------|----------------|--------------|
| **Docker** | 24.x+ | [docs.docker.com/engine/install](https://docs.docker.com/engine/install/) |
| **Docker Compose** | v2.20+ | Included with Docker Desktop or `docker-compose-plugin` |
| **Git** | 2.x+ | `sudo apt install git` (Ubuntu/Debian) |

---

## Step 1: Server Setup

```bash
# SSH into your server
ssh user@your-server-ip

# Create application directory
sudo mkdir -p /opt/equipment-rental-platform
sudo chown $USER:$USER /opt/equipment-rental-platform
cd /opt/equipment-rental-platform
```

---

## Step 2: Clone Repository

```bash
git clone https://github.com/Pasan02/equipment-rental-platform.git .
```

---

## Step 3: Configure Environment

```bash
cp .env.example .env
nano .env
```

**Critical production changes:**

```env
NODE_ENV=production

# Use strong, unique secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your-production-jwt-secret-here
JWT_REFRESH_SECRET=your-production-refresh-secret-here

# Postgres credentials (change from defaults)
POSTGRES_USER=erp_admin
POSTGRES_PASSWORD=strong-db-password-here
POSTGRES_DB=equipment_rental_db
DATABASE_URL="postgresql://erp_admin:strong-db-password-here@postgres:5432/equipment_rental_db?schema=public"

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Storage (configure your S3/R2 bucket)
STORAGE_ENDPOINT=https://your-account.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY_ID=your-key
STORAGE_SECRET_ACCESS_KEY=your-secret
STORAGE_BUCKET_NAME=equipment-rental-bucket
STORAGE_PUBLIC_URL=https://pub-your-bucket.r2.dev

# SMTP (configure your email provider)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email-user
SMTP_PASS=your-email-password
SMTP_FROM="Equipment Rental <noreply@yourdomain.com>"
```

---

## Step 4: Deploy with Docker Compose

### Option A: Build from Source (Small Teams / First Deploy)

```bash
docker compose up --build -d
```

### Option B: Pull from Docker Hub (CI/CD Pipeline / Subsequent Deploys)

```bash
export DOCKERHUB_USERNAME=yourdockerhub

docker compose -f docker/docker-compose.prod.yml pull
docker compose -f docker/docker-compose.prod.yml up -d
```

---

## Step 5: Run Database Migrations & Seed

```bash
# Apply all Prisma migrations
docker compose exec -T api npx prisma migrate deploy

# Seed initial data (admin user, sample categories, equipment)
docker compose exec -T api npx prisma db seed
```

---

## Step 6: Verify Deployment

```bash
# Check all containers are healthy
docker compose ps

# Test API health endpoint
curl http://localhost:3000/api/v1/health

# Expected response:
# {"status":"ok","timestamp":"2026-08-07T14:00:00.000Z","uptime":42.5}
```

**Service URLs:**

| Service | URL |
|---------|-----|
| API Server | `http://your-server-ip:3000/api/v1` |
| Swagger Docs | `http://your-server-ip:3000/api/docs` |
| Web Dashboard | `http://your-server-ip:3001` |

---

## Step 7: Set Up Reverse Proxy (Optional but Recommended)

For production, use Nginx as a reverse proxy with SSL:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name app.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Add SSL with Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com -d app.yourdomain.com
```

---

## Updating the Deployment

When deploying new code changes:

```bash
cd /opt/equipment-rental-platform

# Pull latest code (if building from source)
git pull origin main
docker compose up --build -d

# OR pull latest Docker Hub images (if using CI/CD)
docker compose -f docker/docker-compose.prod.yml pull
docker compose -f docker/docker-compose.prod.yml up -d

# Apply any new migrations
docker compose exec -T api npx prisma migrate deploy

# Clean up old images
docker image prune -f
```

---

## Monitoring & Logs

```bash
# View all container logs
docker compose logs -f

# View specific service logs
docker compose logs -f api
docker compose logs -f web

# Check container resource usage
docker stats
```

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| API container exits immediately | Check logs: `docker compose logs api`. Verify `DATABASE_URL` points to `postgres` hostname (not `localhost`). |
| Database connection refused | Ensure PostgreSQL container is healthy: `docker compose ps`. Wait for health check to pass before starting API. |
| Web app shows blank page | Verify `NEXT_PUBLIC_API_URL` environment variable is set correctly. |
| Redis connection error | Ensure `REDIS_HOST=redis` (container name, not `localhost`) in production. |
| Port already in use | Stop existing services: `docker compose down`. Check with `lsof -i :3000`. |
