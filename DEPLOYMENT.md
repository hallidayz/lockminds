# 🚀 LockingMiNDS Deployment Guide

This guide shows you how to deploy LockingMiNDS to different platforms.

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- A secure SESSION_SECRET (32+ characters)

## 🔐 Environment Variables

Your app needs these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `SESSION_SECRET` | JWT signing secret (32+ chars) | `abc123def456...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `PORT` | Server port (optional) | `3001` |

## 🐳 Docker Deployment

### Quick Start with Docker Compose

1. **Clone and setup:**
   ```bash
   git clone https://github.com/yourusername/lockminds.git
   cd lockminds
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Start with Docker:**
   ```bash
   docker-compose up -d
   ```

3. **Access your app:**
   - Open http://localhost:3001

### Custom Docker Setup

1. **Build the image:**
   ```bash
   docker build -t lockminds .
   ```

2. **Run with environment:**
   ```bash
   docker run -p 3001:3001 \
     -e SESSION_SECRET="your-secret-here" \
     -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
     lockminds
   ```

## ☁️ Cloud Platform Deployment

### Heroku

1. **Install Heroku CLI and login:**
   ```bash
   heroku login
   ```

2. **Create app:**
   ```bash
   heroku create your-lockminds-app
   ```

3. **Set environment variables:**
   ```bash
   heroku config:set SESSION_SECRET=$(openssl rand -hex 32)
   heroku config:set DATABASE_URL=your-postgres-url
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   ```

### Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Set environment variables:**
   ```bash
   vercel env add SESSION_SECRET
   vercel env add DATABASE_URL
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### Railway

1. **Connect your GitHub repo**
2. **Set environment variables:**
   ```bash
   railway variables set SESSION_SECRET=$(openssl rand -hex 32)
   railway variables set DATABASE_URL=your-postgres-url
   ```

3. **Deploy automatically on git push**

### DigitalOcean App Platform

1. **Create new app from GitHub**
2. **Set environment variables in dashboard:**
   - `SESSION_SECRET`: Generate with `openssl rand -hex 32`
   - `DATABASE_URL`: Your PostgreSQL connection string

3. **Deploy automatically**

## 🔒 Security Checklist

Before deploying to production:

- [ ] Generate a strong SESSION_SECRET (32+ characters)
- [ ] Use a secure database with SSL
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up proper firewall rules
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Backup your database regularly

## 🛠️ Troubleshooting

### Common Issues

**"SESSION_SECRET must be set"**
- Make sure you've set the SESSION_SECRET environment variable
- Check that it's at least 32 characters long

**"Database connection failed"**
- Verify your DATABASE_URL is correct
- Ensure your database is accessible from your deployment platform

**"Port already in use"**
- Change the PORT environment variable
- Or stop other services using the same port

### Getting Help

- Check the logs: `docker-compose logs lockminds`
- Verify environment: `echo $SESSION_SECRET`
- Test database connection locally first

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Heroku Node.js Guide](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- [Vercel Node.js Guide](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Railway Documentation](https://docs.railway.app/)

---

**Need help?** Open an issue on GitHub or contact support@acminds.com
