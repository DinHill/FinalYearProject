# 🚀 Production Deployment Guide

Complete guide for deploying the Greenwich Academic Portal API to production.

---

## 📋 Pre-Deployment Checklist

### **1. System Requirements**

- [ ] Windows Server 2019+ or Windows 10/11 Pro
- [ ] Python 3.8 or higher
- [ ] PostgreSQL 12 or higher
- [ ] 4 GB RAM minimum (8 GB recommended)
- [ ] 20 GB free disk space
- [ ] Stable internet connection

### **2. Required Accounts & Credentials**

- [ ] Firebase project with Admin SDK credentials
- [ ] SMTP email account (Gmail, SendGrid, etc.)
- [ ] Twilio account for SMS (optional)
- [ ] Domain name with DNS access
- [ ] SSL/TLS certificate

### **3. Configuration Files**

- [ ] `.env.production` configured with production values
- [ ] `credentials/serviceAccountKey.json` from Firebase
- [ ] Database connection tested
- [ ] CORS origins set to production domains only

### **4. Security Checklist**

- [ ] Strong SECRET_KEY generated
- [ ] Strong database passwords set
- [ ] CORS configured (no wildcards!)
- [ ] DEBUG=false in production
- [ ] Rate limiting enabled
- [ ] Firewall rules configured
- [ ] SSL/TLS certificates installed

---

## 🔧 Installation Steps

### **Step 1: Prepare the Server**

```powershell
# Update system
winget upgrade --all

# Install Python 3.12 (if not installed)
winget install Python.Python.3.12

# Install PostgreSQL (if not installed)
winget install PostgreSQL.PostgreSQL

# Verify installations
python --version
psql --version
```

### **Step 2: Create Database**

```powershell
# Open PostgreSQL command line
psql -U postgres

# In psql:
CREATE DATABASE academic_portal_prod;
CREATE USER academic_user WITH ENCRYPTED PASSWORD 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE academic_portal_prod TO academic_user;
\q
```

### **Step 3: Clone/Copy Project**

```powershell
# Navigate to deployment location
cd C:\inetpub\wwwroot\

# Create directory
New-Item -ItemType Directory -Path "academic-portal-api"
cd academic-portal-api

# Copy project files
# (Use Git clone or copy from development machine)
```

### **Step 4: Configure Environment**

```powershell
# Copy production environment template
Copy-Item ".env.production.example" ".env.production"

# Edit .env.production with production values
notepad .env.production

# Copy Firebase credentials
Copy-Item "path\to\serviceAccountKey.json" "credentials\serviceAccountKey.json"
```

### **Step 5: Install Dependencies**

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install production dependencies
pip install -r requirements.txt
```

### **Step 6: Run Database Migrations**

```powershell
# Set environment to production
$env:APP_ENV="production"

# Run migrations
alembic upgrade head

# Verify migrations
psql -U academic_user -d academic_portal_prod -c "\dt"
```

### **Step 7: Seed Initial Data** (Optional)

```powershell
# Create admin user and initial data
python -m app.scripts.seed_initial_data
```

### **Step 8: Test Application**

```powershell
# Test import
python -c "from app.main import app; print('✅ Application OK')"

# Test database connection
python -c "from app.core.database import engine; print('✅ Database OK')"

# Run health check
python -c "import requests; print(requests.get('http://localhost:8000/health').json())"
```

---

## 🚀 Deployment

### **Method 1: Automated Deployment Script**

```powershell
# Run deployment script
.\deploy-production.ps1

# The script will:
# 1. Run pre-deployment checks
# 2. Backup database
# 3. Install dependencies
# 4. Run migrations
# 5. Run tests
# 6. Start production server
```

### **Method 2: Manual Deployment**

```powershell
# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start production server
uvicorn app.main:app `
    --host 0.0.0.0 `
    --port 8000 `
    --workers 4 `
    --log-level info `
    --no-access-log `
    --proxy-headers `
    --forwarded-allow-ips='*'
```

### **Method 3: Windows Service** (Recommended)

Create a Windows Service using NSSM (Non-Sucking Service Manager):

```powershell
# Download NSSM
# https://nssm.cc/download

# Install service
nssm install AcademicPortalAPI

# Configure service
nssm set AcademicPortalAPI Application "C:\path\to\venv\Scripts\python.exe"
nssm set AcademicPortalAPI AppParameters "-m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4"
nssm set AcademicPortalAPI AppDirectory "C:\path\to\backend"
nssm set AcademicPortalAPI DisplayName "Academic Portal API"
nssm set AcademicPortalAPI Description "Greenwich Academic Portal Backend API"
nssm set AcademicPortalAPI Start SERVICE_AUTO_START

# Start service
nssm start AcademicPortalAPI

# Check service status
nssm status AcademicPortalAPI
```

---

## 🌐 Reverse Proxy Setup (IIS)

### **Configure IIS as Reverse Proxy**

1. **Install URL Rewrite and ARR**:

   ```powershell
   # Install via Web Platform Installer or download from:
   # https://www.iis.net/downloads/microsoft/url-rewrite
   # https://www.iis.net/downloads/microsoft/application-request-routing
   ```

2. **Enable ARR Proxy**:

   - Open IIS Manager
   - Click on server name
   - Double-click "Application Request Routing Cache"
   - Click "Server Proxy Settings" (right panel)
   - Check "Enable proxy"
   - Apply

3. **Create Rewrite Rule**:

   - Select your website
   - Double-click "URL Rewrite"
   - Add Rule → Reverse Proxy
   - Server name: `localhost:8000`
   - Enable SSL Offloading

4. **Configure SSL/TLS**:
   - Bind HTTPS on port 443
   - Add SSL certificate
   - Force HTTPS redirect

**web.config example**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxyInboundRule" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:8000/{R:1}" />
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
```

---

## 🔐 Security Hardening

### **1. Firewall Configuration**

```powershell
# Allow only necessary ports
New-NetFirewallRule -DisplayName "Academic Portal API" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow

# Restrict PostgreSQL to localhost
New-NetFirewallRule -DisplayName "PostgreSQL Local Only" -Direction Inbound -LocalPort 5432 -Protocol TCP -RemoteAddress 127.0.0.1 -Action Allow
```

### **2. Database Security**

```sql
-- Revoke public access
REVOKE ALL ON DATABASE academic_portal_prod FROM PUBLIC;

-- Grant specific permissions
GRANT CONNECT ON DATABASE academic_portal_prod TO academic_user;

-- Use SSL connections
ALTER SYSTEM SET ssl = on;
```

### **3. Environment Variables**

Never expose `.env` files. Store sensitive configs in:

- Windows Credential Manager
- Azure Key Vault
- AWS Secrets Manager
- Environment variables (system-level)

### **4. Regular Updates**

```powershell
# Update Python packages weekly
pip list --outdated
pip install --upgrade <package>

# Update system
winget upgrade --all
```

---

## 📊 Monitoring & Logging

### **1. Application Logs**

Logs are written to `logs/` directory:

- `app.log` - Application logs
- `error.log` - Error logs
- `access.log` - Access logs

### **2. Windows Event Viewer**

View service logs:

```powershell
Get-EventLog -LogName Application -Source "AcademicPortalAPI" -Newest 50
```

### **3. Health Monitoring**

Set up automated health checks:

```powershell
# Create scheduled task for health check
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\path\to\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
Register-ScheduledTask -TaskName "Academic Portal Health Check" -Action $action -Trigger $trigger
```

**health-check.ps1**:

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get
if ($response.status -ne "healthy") {
    Send-MailMessage -To "admin@domain.com" -Subject "API Health Check Failed" -Body "Service is unhealthy"
}
```

### **4. Performance Monitoring**

Use built-in monitoring endpoint:

```bash
GET /api/v1/monitoring/metrics
```

---

## 🔄 Backup & Recovery

### **1. Automated Database Backup**

Built-in backup scheduler runs daily at 2 AM.

Manual backup:

```powershell
# Backup
pg_dump -U academic_user -d academic_portal_prod -f "backup_$(Get-Date -Format 'yyyyMMdd').sql"

# Restore
psql -U academic_user -d academic_portal_prod -f "backup_20240101.sql"
```

### **2. File Backup**

```powershell
# Backup uploads directory
Copy-Item -Recurse "uploads" "backups\uploads_$(Get-Date -Format 'yyyyMMdd')"

# Backup credentials
Copy-Item -Recurse "credentials" "backups\credentials_$(Get-Date -Format 'yyyyMMdd')"
```

### **3. Backup Schedule**

- **Database**: Daily at 2 AM (automated)
- **Files**: Weekly on Sunday at 3 AM
- **Configuration**: Before each deployment
- **Full System**: Monthly

---

## 🔧 Maintenance

### **1. Routine Maintenance Tasks**

**Daily**:

- [ ] Check service status
- [ ] Review error logs
- [ ] Monitor disk space
- [ ] Verify backup completion

**Weekly**:

- [ ] Review access logs
- [ ] Update dependencies (if needed)
- [ ] Database optimization
- [ ] Clean old logs

**Monthly**:

- [ ] Security updates
- [ ] Full system backup
- [ ] Performance review
- [ ] Capacity planning

### **2. Database Maintenance**

```sql
-- Vacuum and analyze
VACUUM ANALYZE;

-- Reindex
REINDEX DATABASE academic_portal_prod;

-- Check database size
SELECT pg_size_pretty(pg_database_size('academic_portal_prod'));
```

### **3. Log Rotation**

Logs automatically rotate daily. Configure in `.env`:

```
LOG_ROTATION="daily"
LOG_BACKUP_COUNT=30
```

---

## 🚨 Troubleshooting

### **Common Issues**

**1. Service won't start**:

```powershell
# Check logs
Get-Content logs\app.log -Tail 50

# Test manually
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**2. Database connection failed**:

```powershell
# Test connection
psql -U academic_user -d academic_portal_prod -c "SELECT 1"

# Check PostgreSQL service
Get-Service -Name postgresql*
```

**3. High memory usage**:

```powershell
# Restart service
Restart-Service AcademicPortalAPI

# Reduce workers in .env
WORKERS=2
```

**4. Slow response times**:

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

-- Optimize indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

---

## 📈 Scaling

### **Vertical Scaling**

- Increase server RAM
- Upgrade CPU
- Faster storage (SSD)

### **Horizontal Scaling**

- Load balancer (nginx, HAProxy)
- Multiple API instances
- Database replication
- Redis caching

### **Performance Optimization**

```python
# In .env.production
WORKERS=8  # 2x CPU cores
DATABASE_POOL_SIZE=20
CACHE_ENABLED=true
ENABLE_COMPRESSION=true
```

---

## ✅ Post-Deployment Verification

### **1. Health Checks**

```bash
# API Health
curl http://your-domain.com/health

# Database Health
curl http://your-domain.com/api/v1/monitoring/health

# Mobile API
curl http://your-domain.com/api/v1/mobile/health
```

### **2. Functional Tests**

- [ ] User login works
- [ ] Data retrieval works
- [ ] Email notifications work
- [ ] File uploads work
- [ ] Mobile sync works
- [ ] Calendar export works

### **3. Performance Tests**

```powershell
# Load test with Apache Bench
ab -n 1000 -c 10 http://your-domain.com/health
```

### **4. Security Tests**

- [ ] HTTPS redirect works
- [ ] CORS configured correctly
- [ ] Rate limiting works
- [ ] Authentication required
- [ ] SQL injection protected

---

## 📞 Support & Maintenance Contacts

**Emergency Contacts**:

- System Administrator: admin@domain.com
- Database Administrator: dba@domain.com
- Security Team: security@domain.com

**Service Providers**:

- Hosting Provider: [Provider Name]
- Database Hosting: [PostgreSQL Service]
- Email Service: [SMTP Provider]
- SMS Service: Twilio

---

## 📝 Deployment Log Template

```
Deployment Date: YYYY-MM-DD HH:MM
Version: v1.0.0
Deployed By: [Name]

Pre-Deployment Checks:
- [ ] Database backup created
- [ ] All tests passed
- [ ] Configuration reviewed

Deployment Steps:
- [ ] Dependencies installed
- [ ] Migrations run
- [ ] Service started
- [ ] Health checks passed

Post-Deployment:
- [ ] Functional tests completed
- [ ] Performance verified
- [ ] Monitoring configured
- [ ] Team notified

Issues Encountered:
- None / [List any issues]

Rollback Plan:
- Database backup: backups/pre_deploy_backup_YYYYMMDD.sql
- Previous version: v0.9.0
```

---

## 🎯 Success Criteria

Deployment is successful when:

- ✅ All health checks return "healthy"
- ✅ API responds in < 200ms
- ✅ All tests pass
- ✅ No error logs
- ✅ HTTPS works
- ✅ Mobile app connects successfully
- ✅ Automated backups working
- ✅ Monitoring alerts configured

---

**Status**: ✅ PRODUCTION READY

**Last Updated**: November 10, 2025

**Maintained By**: Development Team
