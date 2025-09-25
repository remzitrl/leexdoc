#!/bin/bash

# LeexDoc CapRover Deployment Script
# Bu script projeyi CapRover'a deploy etmek için kullanılır

set -e

echo "🚀 LeexDoc CapRover Deployment Script"
echo "======================================"

# Renkli output için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonksiyonlar
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Environment kontrolü
print_step "Environment kontrolü yapılıyor..."

if [ ! -f ".env" ]; then
    print_warning ".env dosyası bulunamadı. env.production.example'dan kopyalanıyor..."
    cp env.production.example .env
    print_warning "Lütfen .env dosyasını düzenleyin ve gerekli değerleri girin!"
    exit 1
fi

# 2. Docker build
print_step "Docker image build ediliyor..."
docker build -t leexdoc:latest .

if [ $? -eq 0 ]; then
    print_success "Docker image başarıyla build edildi"
else
    print_error "Docker build başarısız!"
    exit 1
fi

# 3. CapRover deployment kontrolü
print_step "CapRover deployment hazırlığı..."

if [ ! -f "caprover.yaml" ]; then
    print_error "caprover.yaml dosyası bulunamadı!"
    exit 1
fi

print_success "Deployment dosyaları hazır"

# 4. Environment variables kontrolü
print_step "Environment variables kontrol ediliyor..."

required_vars=(
    "POSTGRES_PASSWORD"
    "NEXTAUTH_SECRET"
    "MINIO_ACCESS_KEY"
    "MINIO_SECRET_KEY"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env || grep -q "^${var}=YOUR_" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_error "Aşağıdaki environment variables eksik veya varsayılan değerlerde:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    print_warning "Lütfen .env dosyasını düzenleyin ve tekrar çalıştırın"
    exit 1
fi

print_success "Tüm environment variables ayarlanmış"

# 5. CapRover deployment talimatları
print_step "CapRover deployment talimatları:"
echo ""
echo "1. CapRover dashboard'a gidin: https://captain.yourdomain.com"
echo "2. 'One-Click Apps' → 'Create New App'"
echo "3. App Name: leexdoc"
echo "4. 'HTTP Settings' → Custom Domain: leexdoc.tural.digital"
echo "5. 'App Configs' → Environment Variables'ı .env dosyasından kopyalayın"
echo "6. 'Deployment' → Docker Compose → caprover.yaml içeriğini yapıştırın"
echo "7. 'Deploy' butonuna tıklayın"
echo ""

# 6. Post-deployment komutları
print_step "Deployment sonrası komutlar:"
echo ""
echo "Database migration:"
echo "  docker exec -it leexdoc_app_1 npx prisma migrate deploy"
echo ""
echo "Admin user oluşturma:"
echo "  docker exec -it leexdoc_app_1 npm run create:admin"
echo ""
echo "MinIO bucket oluşturma:"
echo "  docker exec -it leexdoc_app_1 npm run init:minio"
echo ""

# 7. Health check
print_step "Health check URL'leri:"
echo ""
echo "Ana sayfa: https://leexdoc.tural.digital"
echo "API Health: https://leexdoc.tural.digital/api/health"
echo "Admin Panel: https://leexdoc.tural.digital/admin"
echo ""

print_success "Deployment hazırlığı tamamlandı!"
print_warning "CapRover dashboard'da manuel deployment adımlarını takip edin"

echo ""
echo "📚 Detaylı rehber için: CAPROVER_DEPLOYMENT.md dosyasını okuyun"
