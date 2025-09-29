#!/bin/bash

# Production Deployment Script for Intelligent Spatial Platform

set -e

echo "🚀 Deploying Intelligent Spatial Platform to Production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running from correct directory
if [ ! -f "go.mod" ] || [ ! -f "podman-compose.yml" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Validation functions
validate_environment() {
    print_status "Validating production environment..."

    # Check if .env.prod exists
    if [ ! -f ".env.prod" ]; then
        print_error "Production environment file .env.prod not found"
        exit 1
    fi

    # Load production environment
    set -a
    source .env.prod
    set +a

    # Validate critical environment variables
    required_vars=(
        "DB_HOST" "DB_NAME" "DB_USER" "DB_PASSWORD"
        "JWT_SECRET" "CESIUM_ACCESS_TOKEN"
    )

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set in .env.prod"
            exit 1
        fi
    done

    # Check for default/insecure values
    if [ "$DB_PASSWORD" = "change_this_password_in_production" ]; then
        print_error "Please set a secure database password in .env.prod"
        exit 1
    fi

    if [ "$JWT_SECRET" = "generate_a_secure_jwt_secret_for_production" ]; then
        print_error "Please set a secure JWT secret in .env.prod"
        exit 1
    fi

    if [ "$CESIUM_ACCESS_TOKEN" = "your_production_cesium_token_here" ]; then
        print_error "Please set your production Cesium access token in .env.prod"
        exit 1
    fi

    print_success "Environment validation passed"
}

# Pre-deployment checks
pre_deployment_checks() {
    print_status "Running pre-deployment checks..."

    # Check if podman is available
    if ! command -v podman &> /dev/null; then
        print_error "Podman is not installed"
        exit 1
    fi

    # Check if podman-compose is available
    if ! command -v podman-compose &> /dev/null; then
        print_error "Podman-compose is not installed"
        exit 1
    fi

    # Test Go build
    print_status "Testing Go build..."
    go build -o /tmp/spatial-app-test ./cmd/server
    rm -f /tmp/spatial-app-test
    print_success "Go build test passed"

    # Check disk space (at least 2GB free)
    available_space=$(df . | tail -1 | awk '{print $4}')
    if [ "$available_space" -lt 2097152 ]; then
        print_error "Insufficient disk space. At least 2GB required."
        exit 1
    fi

    print_success "Pre-deployment checks passed"
}

# Backup existing deployment
backup_deployment() {
    if [ -d "backup" ]; then
        print_status "Creating deployment backup..."

        backup_dir="backup/deployment_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"

        # Backup current data volumes if they exist
        if podman volume exists intelligent-spatial-platform_postgres_data 2>/dev/null; then
            print_status "Backing up database..."
            podman run --rm \
                -v intelligent-spatial-platform_postgres_data:/data \
                -v "$(pwd)/$backup_dir":/backup \
                alpine:latest tar czf /backup/postgres_data.tar.gz -C /data .
        fi

        if podman volume exists intelligent-spatial-platform_ollama_data 2>/dev/null; then
            print_status "Backing up Ollama data..."
            podman run --rm \
                -v intelligent-spatial-platform_ollama_data:/data \
                -v "$(pwd)/$backup_dir":/backup \
                alpine:latest tar czf /backup/ollama_data.tar.gz -C /data .
        fi

        print_success "Backup created at $backup_dir"
    fi
}

# Build and deploy
build_and_deploy() {
    print_status "Building and deploying application..."

    # Copy production environment
    cp .env.prod .env

    # Build containers
    print_status "Building application container..."
    podman-compose build --no-cache app

    # Pull latest images for other services
    print_status "Pulling latest service images..."
    podman-compose pull postgres ollama nginx

    print_success "Build completed"
}

# Deploy services
deploy_services() {
    print_status "Deploying services..."

    # Stop existing services gracefully
    print_status "Stopping existing services..."
    podman-compose down --timeout 30 || true

    # Start services in correct order
    print_status "Starting database..."
    podman-compose up -d postgres

    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    max_attempts=60
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if podman exec spatial-postgres pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
            break
        fi
        sleep 2
        attempt=$((attempt + 1))
    done

    if [ $attempt -gt $max_attempts ]; then
        print_error "Database failed to start"
        exit 1
    fi

    print_status "Starting Ollama service..."
    podman-compose up -d ollama

    # Wait for Ollama to be ready
    print_status "Waiting for Ollama service..."
    max_attempts=30
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f http://localhost:${OLLAMA_PORT}/api/tags > /dev/null 2>&1; then
            break
        fi
        sleep 2
        attempt=$((attempt + 1))
    done

    print_status "Starting main application..."
    podman-compose up -d app

    # Wait for application to be ready
    print_status "Waiting for application to be ready..."
    max_attempts=30
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f http://localhost:${APP_PORT}/health > /dev/null 2>&1; then
            break
        fi
        sleep 2
        attempt=$((attempt + 1))
    done

    print_status "Starting Nginx..."
    podman-compose up -d nginx

    print_success "All services deployed successfully"
}

# Post-deployment checks
post_deployment_checks() {
    print_status "Running post-deployment checks..."

    # Health check
    if curl -s -f http://localhost:${NGINX_PORT}/health > /dev/null 2>&1; then
        print_success "Application health check passed"
    else
        print_error "Application health check failed"
        exit 1
    fi

    # Database connectivity
    if podman exec spatial-postgres pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
        print_success "Database connectivity check passed"
    else
        print_error "Database connectivity check failed"
        exit 1
    fi

    # Check service status
    print_status "Service status:"
    podman-compose ps

    print_success "Post-deployment checks passed"
}

# Setup monitoring and logging
setup_monitoring() {
    print_status "Setting up monitoring and logging..."

    # Create log directory
    mkdir -p logs

    # Set up log rotation (basic example)
    cat > logs/logrotate.conf << 'EOF'
logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
EOF

    print_success "Monitoring and logging configured"
}

# Show deployment summary
show_deployment_summary() {
    print_success "🎉 Production deployment completed successfully!"
    echo ""
    echo "📋 Deployment Summary:"
    echo "  - Application URL: http://localhost:${NGINX_PORT}"
    echo "  - Database: PostgreSQL with PostGIS"
    echo "  - AI Service: Ollama"
    echo "  - Reverse Proxy: Nginx"
    echo ""
    echo "🔍 Service Status:"
    podman-compose ps
    echo ""
    echo "📊 Monitoring:"
    echo "  - Health endpoint: http://localhost:${NGINX_PORT}/health"
    echo "  - Logs: podman-compose logs -f [service]"
    echo ""
    echo "🛠️  Useful Commands:"
    echo "  - View logs: podman-compose logs -f"
    echo "  - Restart service: podman-compose restart [service]"
    echo "  - Scale services: podman-compose up -d --scale app=2"
    echo "  - Update deployment: ./scripts/production-deploy.sh"
    echo ""
    echo "🔒 Security Notes:"
    echo "  - Ensure firewall rules are properly configured"
    echo "  - Regularly update container images"
    echo "  - Monitor resource usage and logs"
    echo "  - Backup data regularly"
}

# Main deployment function
main() {
    echo "=========================================="
    echo "🚀 Production Deployment"
    echo "=========================================="
    echo ""

    validate_environment
    pre_deployment_checks
    backup_deployment
    build_and_deploy
    deploy_services
    post_deployment_checks
    setup_monitoring
    show_deployment_summary

    print_success "Production deployment completed!"
}

# Handle script interruption
cleanup() {
    print_warning "Deployment interrupted. Please check service status."
    podman-compose ps
    exit 1
}

trap cleanup INT TERM

# Run main function
main "$@"