#!/bin/bash

# Production Deployment Validation Script
echo "🔍 Validating Production Deployment Configuration..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Check required files
echo -e "\n${YELLOW}📋 Checking Required Files...${NC}"

files=(
    "docker-compose.yml"
    "Dockerfile.api"
    "web/Dockerfile.web" 
    "nginx.conf"
    ".env.production.template"
    "web/.env.production.local.template"
    ".dockerignore"
    "DEPLOYMENT.md"
)

all_files_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "$file exists"
    else
        print_status 1 "$file missing"
        all_files_exist=false
    fi
done

# Check SSL directory
echo -e "\n${YELLOW}🔒 Checking SSL Configuration...${NC}"
if [ -d "ssl" ]; then
    print_status 0 "SSL directory exists"
    if [ -f "ssl/cert.pem" ] && [ -f "ssl/key.pem" ]; then
        print_status 0 "SSL certificates found"
        # Check certificate validity
        openssl x509 -in ssl/cert.pem -noout -dates 2>/dev/null
        if [ $? -eq 0 ]; then
            print_status 0 "SSL certificate is valid"
        else
            print_status 1 "SSL certificate validation failed"
        fi
    else
        print_status 1 "SSL certificates missing (cert.pem, key.pem)"
    fi
else
    print_status 1 "SSL directory missing"
fi

# Check environment files (production ready)
echo -e "\n${YELLOW}🌍 Checking Environment Configuration...${NC}"
if [ -f ".env.production" ]; then
    print_status 0 ".env.production exists"
    # Check for placeholder values
    if grep -q "your-" .env.production; then
        print_status 1 ".env.production contains placeholder values"
    else
        print_status 0 ".env.production appears configured"
    fi
else
    print_status 1 ".env.production missing - copy from template"
fi

if [ -f "web/.env.production.local" ]; then
    print_status 0 "web/.env.production.local exists"
    if grep -q "your-" web/.env.production.local; then
        print_status 1 "web/.env.production.local contains placeholder values"
    else
        print_status 0 "web/.env.production.local appears configured"
    fi
else
    print_status 1 "web/.env.production.local missing - copy from template"
fi

# Check Docker availability
echo -e "\n${YELLOW}🐳 Checking Docker...${NC}"
if command -v docker &> /dev/null; then
    print_status 0 "Docker is installed"
    if docker info &> /dev/null; then
        print_status 0 "Docker daemon is running"
        
        # Validate Docker Compose file
        if command -v docker-compose &> /dev/null; then
            print_status 0 "Docker Compose is installed"
            docker-compose config &> /dev/null
            print_status $? "Docker Compose configuration is valid"
        else
            print_status 1 "Docker Compose not installed"
        fi
    else
        print_status 1 "Docker daemon not running"
    fi
else
    print_status 1 "Docker not installed"
fi

# Check nginx configuration syntax
echo -e "\n${YELLOW}🌐 Checking Nginx Configuration...${NC}"
if command -v nginx &> /dev/null; then
    nginx -t -c $(pwd)/nginx.conf &> /dev/null
    print_status $? "Nginx configuration syntax"
else
    echo -e "${YELLOW}⚠️  Nginx not installed locally - will be validated in container${NC}"
fi

# Summary
echo -e "\n${YELLOW}📊 Validation Summary${NC}"
if $all_files_exist; then
    echo -e "${GREEN}✅ All required files are present${NC}"
else
    echo -e "${RED}❌ Some required files are missing${NC}"
fi

echo -e "\n${YELLOW}🚀 Next Steps:${NC}"
echo "1. Install Docker and Docker Compose if not available"
echo "2. Copy environment templates and fill with production values"
echo "3. Obtain and place SSL certificates in ssl/ directory"
echo "4. Update nginx.conf with your domain name"
echo "5. Run: docker-compose build"
echo "6. Run: docker-compose up -d"
echo "7. Test endpoints and SSL configuration"

echo -e "\n${YELLOW}📖 For detailed instructions, see DEPLOYMENT.md${NC}"