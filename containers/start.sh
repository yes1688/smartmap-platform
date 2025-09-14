#!/bin/sh

# Intelligent Spatial Platform Startup Script

echo "🚀 Starting Intelligent Spatial Platform..."

# Set default port if not provided
export PORT=${PORT:-8080}

# Check if required environment variables are set
check_env_var() {
    if [ -z "$2" ]; then
        echo "❌ Error: Environment variable $1 is not set"
        exit 1
    fi
}

# Validate required environment variables
check_env_var "DB_HOST" "$DB_HOST"
check_env_var "DB_NAME" "$DB_NAME"
check_env_var "DB_USER" "$DB_USER"
check_env_var "DB_PASSWORD" "$DB_PASSWORD"

# Wait for database to be ready
wait_for_db() {
    echo "⏳ Waiting for database to be ready..."
    max_attempts=30
    attempt=1

    while [ $attempt -le $max_attempts ]; do
        if pg_isready -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
            echo "✅ Database is ready!"
            break
        fi

        echo "⏳ Database not ready, attempt $attempt/$max_attempts"
        sleep 2
        attempt=$((attempt + 1))
    done

    if [ $attempt -gt $max_attempts ]; then
        echo "❌ Database connection timeout after $max_attempts attempts"
        exit 1
    fi
}

# Wait for Ollama service to be ready
wait_for_ollama() {
    if [ -n "$OLLAMA_URL" ]; then
        echo "⏳ Waiting for Ollama service to be ready..."
        max_attempts=15
        attempt=1

        while [ $attempt -le $max_attempts ]; do
            if curl -s -f "$OLLAMA_URL/api/tags" > /dev/null 2>&1; then
                echo "✅ Ollama service is ready!"
                break
            fi

            echo "⏳ Ollama not ready, attempt $attempt/$max_attempts"
            sleep 2
            attempt=$((attempt + 1))
        done

        if [ $attempt -gt $max_attempts ]; then
            echo "⚠️ Ollama service not available, but continuing without it"
        fi
    fi
}

# Function to handle graceful shutdown
cleanup() {
    echo "🛑 Received shutdown signal, stopping application..."
    if [ -n "$APP_PID" ]; then
        kill -TERM "$APP_PID"
        wait "$APP_PID"
    fi
    echo "✅ Application stopped gracefully"
    exit 0
}

# Set up signal handlers
trap cleanup INT TERM

# Wait for dependencies
wait_for_db
wait_for_ollama

# Print application info
echo "📋 Application Information:"
echo "   Version: ${VERSION:-dev}"
echo "   Build Time: ${BUILD_TIME:-unknown}"
echo "   Build Environment: ${BUILD_ENV:-development}"
echo "   Port: $PORT"
echo "   Database: $DB_HOST:${DB_PORT:-5432}/$DB_NAME"
echo "   Ollama URL: ${OLLAMA_URL:-not configured}"
echo "   Gin Mode: ${GIN_MODE:-release}"

# Start the application
echo "🚀 Starting Intelligent Spatial Platform on port $PORT..."
./spatial-app &
APP_PID=$!

# Wait for the application to start
sleep 2

# Check if application started successfully
if kill -0 "$APP_PID" 2>/dev/null; then
    echo "✅ Application started successfully (PID: $APP_PID)"
else
    echo "❌ Application failed to start"
    exit 1
fi

# Keep the script running and wait for the application
wait "$APP_PID"
APP_EXIT_CODE=$?

if [ $APP_EXIT_CODE -ne 0 ]; then
    echo "❌ Application exited with code $APP_EXIT_CODE"
    exit $APP_EXIT_CODE
fi

echo "✅ Application finished successfully"