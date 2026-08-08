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

**Production Environment Configuration (`.env`):**

```env
NODE_ENV=production

# Server Ports
PORT=3000
WEB_PORT=3001
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1

# Docker Hub Username for production container images
DOCKERHUB_USERNAME=yourdockerhub

# JWT Authentication Secrets (generate using: openssl rand -base64 32)
JWT_SECRET=your-production-jwt-secret-here
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-production-refresh-secret-here
JWT_REFRESH_EXPIRATION=7d

# Database Connection (AWS RDS / Azure PostgreSQL Flexible Server / Supabase)
DATABASE_URL="postgresql://dbuser:strong-db-password@equipment-rental-db.cluster-xyz.us-east-1.rds.amazonaws.com:5432/equipment_rental_db?sslmode=require"

# Redis Cache Connection (AWS ElastiCache / Azure Cache for Redis / Upstash)
REDIS_HOST=equipment-rental-redis.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Cloud Storage (AWS S3 / Cloudflare R2)
STORAGE_ENDPOINT=https://your-account.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY_ID=your-key
STORAGE_SECRET_ACCESS_KEY=your-secret
STORAGE_BUCKET_NAME=equipment-rental-bucket
STORAGE_PUBLIC_URL=https://pub-your-bucket.r2.dev

# SMTP Email Configuration
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email-user
SMTP_PASS=your-email-password
SMTP_FROM="Equipment Rental <noreply@yourdomain.com>"
```

---

## Step 4: Deploy with Docker Compose

### Option A: Local / Staging Build from Source

For dev/staging environments building images from local source code:

```bash
docker compose up --build -d
```

### Option B: Cloud Production Deployment (Managed DB / Docker Hub)

For production deployments fetching pre-built images from Docker Hub and connecting to cloud managed database (AWS RDS / Azure Flexible Server):

```bash
# Load environment variables and pull pre-built production images
export DOCKERHUB_USERNAME=yourdockerhub

docker compose -f docker/docker-compose.prod.yml pull
docker compose -f docker/docker-compose.prod.yml up -d
```

---

## Step 5: Run Database Migrations & Seed

```bash
# Apply all Prisma migrations to target database (AWS RDS / Azure Flexible Server)
docker compose -f docker/docker-compose.prod.yml exec -T api npx prisma migrate deploy

# Seed initial data (admin user, sample categories, equipment)
docker compose -f docker/docker-compose.prod.yml exec -T api npx prisma db seed
```

---

## Step 6: Verify Deployment

```bash
# Check running container health
docker compose -f docker/docker-compose.prod.yml ps

# Test API health endpoint
curl http://localhost:3000/api/v1/health

# Expected response:
# {"status":"ok","timestamp":"2026-08-08T10:00:00.000Z","uptime":12.5}
```

**Service Endpoints:**

| Service | URL |
|---------|-----|
| API Server | `http://your-server-ip:3000/api/v1` |
| Swagger Docs | `http://your-server-ip:3000/api/docs` |
| Web Dashboard | `http://your-server-ip:3001` |

---

## Step 7: Set Up Reverse Proxy with Nginx & SSL

For production HTTPS encryption:

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

Enable SSL via Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com -d app.yourdomain.com
```

---

## Updating the Deployment

When deploying code updates via CI/CD:

```bash
cd /opt/equipment-rental-platform

# Pull latest Docker Hub images
docker compose -f docker/docker-compose.prod.yml pull
docker compose -f docker/docker-compose.prod.yml up -d

# Apply database migrations
docker compose -f docker/docker-compose.prod.yml exec -T api npx prisma migrate deploy

# Clean up dangling images
docker image prune -f
```

---

## Monitoring & Logs

```bash
# View all container logs
docker compose -f docker/docker-compose.prod.yml logs -f

# View API logs
docker compose -f docker/docker-compose.prod.yml logs -f api

# View Web logs
docker compose -f docker/docker-compose.prod.yml logs -f web

# Check container resource utilization
docker stats
```

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| API container exits immediately | Check logs: `docker compose logs api`. Ensure `DATABASE_URL` is set correctly in `.env` and accessible from cloud server. |
| Database SSL connection error | Ensure `?sslmode=require` is appended to `DATABASE_URL` for AWS RDS or Azure Flexible Server. |
| Web app cannot fetch API data | Verify `NEXT_PUBLIC_API_URL` environment variable matches your public API URL. |
| Redis connection timeout | Check security group / firewall rules for AWS ElastiCache or Azure Cache endpoint. |
| Port in use error | Check active ports with `sudo lsof -i :3000` or `sudo lsof -i :3001`. |
