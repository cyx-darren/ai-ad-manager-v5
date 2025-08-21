# Deployment Guide

This guide covers deploying the Google Analytics Dashboard to production using Docker.

## Prerequisites

- Docker and Docker Compose installed
- SSL certificates for your domain
- Domain name pointing to your server
- Google Analytics and Google Ads API credentials (if using)
- Supabase project configured

## Deployment Checklist

### 1. Environment Configuration

- [ ] Copy `.env.production.template` to `.env.production`
- [ ] Copy `web/.env.production.local.template` to `web/.env.production.local`
- [ ] Fill in all environment variables with production values
- [ ] Verify Supabase configuration
- [ ] Set up Google Analytics credentials
- [ ] Configure Google Ads API (optional)

### 2. SSL Certificates

- [ ] Obtain SSL certificates for your domain
- [ ] Place certificate files in `./ssl/` directory:
  - `cert.pem` - SSL certificate
  - `key.pem` - Private key
- [ ] Update nginx.conf with your domain name if needed

### 3. Security Configuration

- [ ] Update `nginx.conf` server_name with your domain
- [ ] Configure firewall rules:
  - Allow ports 80 (HTTP), 443 (HTTPS)
  - Block direct access to ports 3000, 5000
- [ ] Set secure passwords for all services
- [ ] Enable fail2ban or similar intrusion prevention

### 4. Build and Deploy

```bash
# Build all containers
docker-compose build

# Start services
docker-compose up -d

# Check service health
docker-compose ps
```

### 5. Health Checks

After deployment, verify:

- [ ] `curl https://your-domain.com/api/health` returns healthy status
- [ ] Web interface loads at `https://your-domain.com`
- [ ] SSL certificate is valid (check with SSL Labs)
- [ ] All redirects work properly (HTTP to HTTPS)
- [ ] Log files are being created

## Production Maintenance

### Monitoring

Check service status:
```bash
docker-compose ps
docker-compose logs api
docker-compose logs web
docker-compose logs nginx
```

### Updates

To update the application:
```bash
git pull origin main
docker-compose build
docker-compose up -d
```

### Backup

Important files to backup:
- Environment files (`.env.production`, `.env.production.local`)
- SSL certificates (`./ssl/`)
- Database backups (Supabase handles this)
- Log files (`./logs/`)

### Log Rotation

Set up log rotation for nginx and application logs:
```bash
# Example logrotate configuration
/path/to/project/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    copytruncate
}
```

## Troubleshooting

### Common Issues

1. **SSL Certificate Issues**
   - Verify certificate files exist and have correct permissions
   - Check certificate validity: `openssl x509 -in cert.pem -text -noout`

2. **Container Health Check Failures**
   - Check logs: `docker-compose logs [service]`
   - Verify environment variables are set correctly
   - Ensure services can communicate on the Docker network

3. **API Connection Issues**
   - Verify Supabase credentials and network access
   - Check Google Analytics API credentials
   - Ensure environment variables are properly set

4. **Performance Issues**
   - Monitor resource usage: `docker stats`
   - Check nginx access logs for high traffic patterns
   - Verify cache configuration is working

### Commands

```bash
# View real-time logs
docker-compose logs -f

# Restart specific service
docker-compose restart api

# Scale services
docker-compose up -d --scale api=2

# Update containers
docker-compose pull
docker-compose up -d

# Clean up
docker-compose down
docker system prune -f
```

## Security Best Practices

- Keep Docker images updated
- Use non-root users in containers
- Regularly rotate secrets and API keys
- Monitor logs for suspicious activity
- Keep SSL certificates updated
- Use strong passwords and secure environment variable storage
- Implement proper backup and disaster recovery procedures