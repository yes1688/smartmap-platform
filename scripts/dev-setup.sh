#!/bin/bash

# Development Environment Setup Script for Intelligent Spatial Platform

set -e

echo "🚀 Setting up Intelligent Spatial Platform Development Environment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check if podman is installed
    if ! command -v podman &> /dev/null; then
        print_error "Podman is not installed. Please install podman first."
        exit 1
    fi

    # Check if podman-compose is installed
    if ! command -v podman-compose &> /dev/null; then
        print_error "Podman-compose is not installed. Please install podman-compose first."
        exit 1
    fi

    # Check if go is installed
    if ! command -v go &> /dev/null; then
        print_error "Go is not installed. Please install Go 1.21+ first."
        exit 1
    fi

    # Check Go version
    GO_VERSION=$(go version | cut -d' ' -f3 | sed 's/go//')
    REQUIRED_VERSION="1.21"
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$GO_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_error "Go version $REQUIRED_VERSION or higher is required. Current: $GO_VERSION"
        exit 1
    fi

    print_success "Prerequisites check passed"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."

    if [ ! -f ".env" ]; then
        cp .env.dev .env
        print_success "Created .env from .env.dev"
    else
        print_warning ".env already exists, skipping"
    fi
}

# Initialize Go modules
setup_go_modules() {
    print_status "Setting up Go modules..."

    go mod tidy
    print_success "Go modules initialized"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."

    mkdir -p logs
    mkdir -p tmp
    mkdir -p data/postgres
    mkdir -p data/ollama

    print_success "Directories created"
}

# Setup database initialization
setup_database() {
    print_status "Setting up database initialization..."

    cat > configs/init.sql << 'EOF'
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create initial tables will be handled by GORM AutoMigrate
-- This file can be extended with additional setup as needed

-- Create indexes for spatial queries
-- These will be added after table creation by the application

-- Insert sample historical sites data
-- INSERT INTO historical_sites (name, description, era, latitude, longitude, address, is_active) VALUES
-- ('台北101', '台北最高的摩天大樓', '現代', 25.0340, 121.5645, '台北市信義區', true);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO spatial_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO spatial_user;
EOF

    print_success "Database initialization script created"
}

# Build the application
build_application() {
    print_status "Building Go application..."

    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
        -ldflags="-w -s -X main.Version=dev -X main.BuildTime=$(date -u +%Y-%m-%dT%H:%M:%SZ) -X main.BuildEnv=development" \
        -o bin/spatial-app \
        ./cmd/server

    print_success "Application built successfully"
}

# Start services
start_services() {
    print_status "Starting development services with podman-compose..."

    # Load environment variables
    set -a
    source .env
    set +a

    # Start services
    podman-compose -f podman-compose.yml up -d postgres ollama

    print_status "Waiting for services to be ready..."
    sleep 10

    # Check if postgres is ready
    max_attempts=30
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if podman exec spatial-postgres pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
            print_success "PostgreSQL is ready!"
            break
        fi
        print_status "Waiting for PostgreSQL... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done

    if [ $attempt -gt $max_attempts ]; then
        print_error "PostgreSQL failed to start"
        exit 1
    fi

    print_success "Development services are running"
}

# Pull Ollama model
setup_ollama_model() {
    print_status "Setting up Ollama model..."

    # Wait a bit more for Ollama to be fully ready
    sleep 5

    # Pull the default model
    if podman exec spatial-ollama ollama pull llama2:7b; then
        print_success "Ollama model llama2:7b pulled successfully"
    else
        print_warning "Failed to pull Ollama model. You can pull it later manually."
    fi
}

# Show service status
show_status() {
    print_status "Development environment status:"
    echo ""
    podman-compose -f podman-compose.yml ps
    echo ""
    print_success "Development environment is ready!"
    echo ""
    echo "🌐 Services:"
    echo "  - Application: http://localhost:8080"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Ollama: http://localhost:11434"
    echo ""
    echo "📝 Useful commands:"
    echo "  - Start services: podman-compose up -d"
    echo "  - Stop services: podman-compose down"
    echo "  - View logs: podman-compose logs -f [service]"
    echo "  - Run app locally: go run cmd/server/main.go"
    echo "  - Access database: podman exec -it spatial-postgres psql -U spatial_user -d spatial_platform_dev"
    echo ""
    echo "🔧 Configuration:"
    echo "  - Environment: .env"
    echo "  - Database init: configs/init.sql"
    echo ""
}

# Main execution
main() {
    echo "=========================================="
    echo "🏗️  Intelligent Spatial Platform Setup"
    echo "=========================================="
    echo ""

    check_prerequisites
    setup_environment
    setup_go_modules
    create_directories
    setup_database
    build_application
    start_services
    setup_ollama_model
    show_status

    print_success "Development environment setup completed!"
    echo ""
    print_status "You can now start developing:"
    echo "  1. Run 'go run cmd/server/main.go' to start the application locally"
    echo "  2. Open http://localhost:8080 in your browser"
    echo "  3. Check the README.md for more information"
}

# Run main function
main "$@"