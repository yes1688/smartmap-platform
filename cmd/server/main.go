package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"intelligent-spatial-platform/internal/api"
	"intelligent-spatial-platform/internal/ai"
	"intelligent-spatial-platform/internal/game"
	"intelligent-spatial-platform/internal/geo"
	"intelligent-spatial-platform/internal/middleware"
	"intelligent-spatial-platform/internal/voice"
	"intelligent-spatial-platform/internal/websocket"
)

var (
	Version   = "dev"
	BuildTime = "unknown"
	BuildEnv  = "development"
)

func main() {
	// Load environment variables
	if err := loadEnv(); err != nil {
		log.Fatalf("Failed to load environment: %v", err)
	}

	// Setup logging
	setupLogging()

	logrus.WithFields(logrus.Fields{
		"version":   Version,
		"buildTime": BuildTime,
		"buildEnv":  BuildEnv,
	}).Info("Starting Intelligent Spatial Platform")

	// Initialize database
	db, err := initDatabase()
	if err != nil {
		logrus.Fatalf("Failed to initialize database: %v", err)
	}

	// Initialize services
	services := initServices(db)

	// Setup Gin router
	router := setupRouter(services)

	// Start server
	startServer(router)
}

func loadEnv() error {
	env := os.Getenv("BUILD_ENV")
	if env == "" {
		env = "development"
	}

	// In containerized environments, skip loading .env files
	// since environment variables are already set
	if os.Getenv("DB_HOST") != "" {
		return nil
	}

	envFile := fmt.Sprintf(".env.%s", env)
	if env == "development" {
		envFile = ".env.dev"
	} else if env == "production" {
		envFile = ".env.prod"
	}

	if _, err := os.Stat(envFile); err == nil {
		return godotenv.Load(envFile)
	}
	return godotenv.Load()
}

func setupLogging() {
	level := os.Getenv("LOG_LEVEL")
	format := os.Getenv("LOG_FORMAT")

	logrus.SetOutput(os.Stdout)

	switch level {
	case "debug":
		logrus.SetLevel(logrus.DebugLevel)
	case "info":
		logrus.SetLevel(logrus.InfoLevel)
	case "warn":
		logrus.SetLevel(logrus.WarnLevel)
	case "error":
		logrus.SetLevel(logrus.ErrorLevel)
	default:
		logrus.SetLevel(logrus.InfoLevel)
	}

	if format == "json" {
		logrus.SetFormatter(&logrus.JSONFormatter{})
	} else {
		logrus.SetFormatter(&logrus.TextFormatter{
			FullTimestamp: true,
		})
	}
}

func initDatabase() (*gorm.DB, error) {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Taipei",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %v", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// Run migrations
	if err := runMigrations(db); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %v", err)
	}

	return db, nil
}

func runMigrations(db *gorm.DB) error {
	// Auto-migrate models
	return db.AutoMigrate(
		&game.Player{},
		&game.Item{},
		&game.GameSession{},
		&geo.Location{},
		&geo.HistoricalSite{},
	)
}

type Services struct {
	DB        *gorm.DB
	AI        *ai.Service
	Game      *game.Service
	Geo       *geo.Service
	Voice     *voice.Service
	WebSocket *websocket.Hub
}

func initServices(db *gorm.DB) *Services {
	// Initialize AI service
	aiService := ai.NewService(os.Getenv("OLLAMA_URL"))

	// Initialize game service
	gameService := game.NewService(db, aiService)

	// Initialize geo service
	geoService := geo.NewService(db)

	// Initialize voice service
	voiceService := voice.NewService()

	// Initialize websocket hub
	wsHub := websocket.NewHub()
	go wsHub.Run()

	return &Services{
		DB:        db,
		AI:        aiService,
		Game:      gameService,
		Geo:       geoService,
		Voice:     voiceService,
		WebSocket: wsHub,
	}
}

func setupRouter(services *Services) *gin.Engine {
	ginMode := os.Getenv("GIN_MODE")
	if ginMode != "" {
		gin.SetMode(ginMode)
	}

	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"version":   Version,
			"buildTime": BuildTime,
			"buildEnv":  BuildEnv,
		})
	})

	// Initialize API routes
	apiHandler := api.NewHandler(services.DB, services.AI, services.Game, services.Geo, services.Voice)
	apiGroup := router.Group("/api/v1")
	{
		// Basic routes (no rate limiting)
		apiGroup.GET("/locations", apiHandler.GetLocations)
		apiGroup.POST("/locations", apiHandler.CreateLocation)
		apiGroup.GET("/historical-sites", apiHandler.GetHistoricalSites)
		apiGroup.GET("/game/status", apiHandler.GetGameStatus)
		apiGroup.GET("/game/players", apiHandler.GetPlayers)
		apiGroup.GET("/game/sessions", apiHandler.GetSessions)
		apiGroup.POST("/game/sessions", apiHandler.CreateSession)
		apiGroup.POST("/game/collect", apiHandler.CollectItem)

		// Rate limited routes for AI and movement (uses geocoding)
		aiGroup := apiGroup.Group("/")
		aiGroup.Use(middleware.GeocodingRateLimit())
		{
			aiGroup.POST("/voice/process", apiHandler.ProcessVoice)
			aiGroup.POST("/ai/chat", apiHandler.ChatWithAI)
			aiGroup.POST("/game/move", apiHandler.MovePlayer)
			aiGroup.POST("/places/search", apiHandler.SearchPlace) // Google Places API endpoint
		}

		// Strict rate limiting for debugging endpoints
		debugGroup := apiGroup.Group("/debug")
		debugGroup.Use(middleware.StrictRateLimit())
		{
			debugGroup.POST("/movement", apiHandler.DebugMovement)
		}
	}

	// WebSocket endpoint
	router.GET("/ws", func(c *gin.Context) {
		websocket.HandleWebSocket(services.WebSocket, c.Writer, c.Request)
	})

	// Serve static files (CesiumJS frontend)
	router.Static("/static", "./web")
	router.StaticFile("/", "./web/index.html")

	return router
}

func startServer(router *gin.Engine) {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	// Graceful shutdown
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logrus.Fatalf("Failed to start server: %v", err)
		}
	}()

	logrus.WithField("port", port).Info("Server started")

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logrus.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logrus.Fatalf("Server forced to shutdown: %v", err)
	}

	logrus.Info("Server exited")
}