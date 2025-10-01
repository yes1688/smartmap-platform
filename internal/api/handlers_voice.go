package api

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"intelligent-spatial-platform/internal/ai"
	"intelligent-spatial-platform/internal/geo"
)

// ProcessVoice processes voice audio input
func (h *Handler) ProcessVoice(c *gin.Context) {
	var request struct {
		AudioData string `json:"audioData"`
		Language  string `json:"language"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	text, err := h.voice.ProcessAudio(request.AudioData, request.Language)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"text": text})
}

// ProcessVoiceCommand handles unified voice command processing
func (h *Handler) ProcessVoiceCommand(c *gin.Context) {
	var request struct {
		Command  string  `json:"command" binding:"required"`
		PlayerID string  `json:"playerId" binding:"required"`
		Lat      float64 `json:"lat"`
		Lng      float64 `json:"lng"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get player's current location
	var currentLocation *geo.Location
	if request.Lat != 0 && request.Lng != 0 {
		currentLocation = &geo.Location{
			Latitude:  request.Lat,
			Longitude: request.Lng,
		}
	} else {
		// Get from player status
		player, err := h.game.GetPlayerStatus(request.PlayerID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get player location"})
			return
		}
		currentLocation = &geo.Location{
			Latitude:  player.Latitude,
			Longitude: player.Longitude,
		}
	}

	// Parse intent using AI (with per-user rate limiting)
	intentParser := ai.NewIntentParser(h.ai, h.geo.GetGeocoding())
	intent, err := intentParser.ParseVoiceCommandWithUser(request.PlayerID, request.Command, currentLocation)
	if err != nil {
		log.Printf("❌ Intent parsing failed: %v", err)

		// Check if it's a rate limit error
		errMsg := err.Error()
		if strings.Contains(errMsg, "rate limit exceeded") {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "AI 服務繁忙",
				"message": "請稍候片刻再試 🙏",
				"details": errMsg,
			})
			return
		}

		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "無法理解指令",
			"message": "請換個說法試試 😊",
			"details": errMsg,
		})
		return
	}

	log.Printf("✅ Intent parsed: type=%s, category=%s, confidence=%.2f",
		intent.Type, intent.Category, intent.Confidence)

	// Get user usage stats for warnings
	used, remaining, total, resetTime := h.ai.GetUserUsageStats(request.PlayerID)
	usageWarning := h.ai.FormatUsageWarning(remaining, resetTime)

	log.Printf("📊 用戶 %s AI 使用統計: %d/%d (剩餘 %d)", request.PlayerID, used, total, remaining)

	// Store usage stats in context for handlers to use
	c.Set("usageStats", gin.H{
		"used":      used,
		"remaining": remaining,
		"total":     total,
		"warning":   usageWarning,
	})

	// Route to appropriate handler based on intent type
	switch intent.Type {
	case ai.IntentSearch:
		h.handleSearchIntent(c, intent, currentLocation, request.PlayerID)
	case ai.IntentMove:
		h.handleMoveIntent(c, intent, currentLocation, request.PlayerID)
	case ai.IntentDescribe:
		h.handleDescribeIntent(c, intent, currentLocation)
	case ai.IntentRecommend:
		h.handleRecommendIntent(c, intent, currentLocation)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown intent type"})
	}
}

// handleSearchIntent processes search nearby intent
func (h *Handler) handleSearchIntent(
	c *gin.Context,
	intent *ai.VoiceIntent,
	currentLocation *geo.Location,
	playerID string,
) {
	// This handler is only for "nearby list search" (附近有什麼)
	// Build search query with current location context
	log.Printf("🔍 User wants nearby list search: category=%s, keywords=%v", intent.Category, intent.Keywords)

	// Execute nearby search using PostGIS
	nearbyService := geo.NewNearbySearchService(h.db, h.geo.GetGeocoding())

	radius := intent.Radius
	if radius == 0 {
		radius = 500 // Default 500 meters
	}

	results, err := nearbyService.SearchNearby(
		currentLocation.Latitude,
		currentLocation.Longitude,
		string(intent.Category),
		radius,
		10, // Limit to 10 results
	)
	if err != nil {
		log.Printf("❌ Nearby search failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed"})
		return
	}

	log.Printf("✅ Found %d nearby locations", results.Total)

	// Generate AI narration
	narrator := ai.NewNearbyNarrator(h.ai)
	categoryName := ai.CategoryToChineseName(intent.Category)
	aiResponse, err := narrator.GenerateNarration(results, categoryName)
	if err != nil {
		log.Printf("⚠️ AI narration failed: %v, using fallback", err)
		aiResponse = fmt.Sprintf("找到 %d 個%s", results.Total, categoryName)
	}

	// Attach AI response to results
	results.AIResponse = aiResponse

	// Get usage stats from context
	usageStats, _ := c.Get("usageStats")

	response := gin.H{
		"success":       true,
		"intentType":    "search",
		"nearbyResults": results,
		"aiResponse":    aiResponse,
		"usageStats":    usageStats,
	}

	c.JSON(http.StatusOK, response)
}

// handleMoveIntent processes move to location intent
func (h *Handler) handleMoveIntent(
	c *gin.Context,
	intent *ai.VoiceIntent,
	currentLocation *geo.Location,
	playerID string,
) {
	// Check if targetName is empty
	if intent.TargetName == "" {
		log.Printf("❌ Movement intent has no target name")
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "無法識別目的地",
			"message": "請說明要去哪裡 😊",
		})
		return
	}

	// Use existing movement command processing
	sessionID := c.GetHeader("X-Session-ID")
	if sessionID == "" {
		sessionID = "web_session_" + playerID
	}
	clientIP := c.ClientIP()

	// Construct a proper movement command with "go to" prefix
	movementCommand := fmt.Sprintf("go to %s", intent.TargetName)
	log.Printf("🚶 Constructed movement command: %s", movementCommand)

	movementResult, err := h.game.ProcessAIMovementCommand(
		playerID,
		movementCommand,
		sessionID,
		clientIP,
	)

	if err != nil {
		log.Printf("❌ Movement command failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if movementResult.RateLimited {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"success":     false,
			"intentType":  "move",
			"rateLimited": true,
			"message":     movementResult.Message,
		})
		return
	}

	// Get usage stats from context
	usageStats, _ := c.Get("usageStats")

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"intentType": "move",
		"movement":   movementResult,
		"aiResponse": movementResult.Message,
		"usageStats": usageStats,
	})
}

// handleDescribeIntent processes describe location intent
func (h *Handler) handleDescribeIntent(
	c *gin.Context,
	intent *ai.VoiceIntent,
	currentLocation *geo.Location,
) {
	// Simple location description
	description := fmt.Sprintf("目前位置：緯度 %.6f，經度 %.6f",
		currentLocation.Latitude, currentLocation.Longitude)

	// Generate AI description
	prompt := fmt.Sprintf("用戶想知道他現在的位置。座標是緯度 %.6f，經度 %.6f。請用親切的語氣回應（50字內）。",
		currentLocation.Latitude, currentLocation.Longitude)
	aiResponse, err := h.ai.Chat(prompt, "你是友善的旅遊助手")
	if err != nil {
		aiResponse = description
	}

	// Get usage stats from context
	usageStats, _ := c.Get("usageStats")

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"intentType": "describe",
		"location":   currentLocation,
		"aiResponse": aiResponse,
		"usageStats": usageStats,
	})
}

// handleRecommendIntent processes recommendation intent
func (h *Handler) handleRecommendIntent(
	c *gin.Context,
	intent *ai.VoiceIntent,
	currentLocation *geo.Location,
) {
	// Search nearby locations for recommendation
	nearbyService := geo.NewNearbySearchService(h.db, h.geo.GetGeocoding())
	results, err := nearbyService.SearchNearby(
		currentLocation.Latitude,
		currentLocation.Longitude,
		string(intent.Category),
		1000, // 1km radius for recommendations
		5,    // Top 5
	)

	if err != nil || results.Total == 0 {
		c.JSON(http.StatusOK, gin.H{
			"success":    true,
			"intentType": "recommend",
			"aiResponse": "抱歉，附近暫時沒有合適的推薦",
		})
		return
	}

	// Generate recommendation using AI
	categoryName := ai.CategoryToChineseName(intent.Category)
	narrator := ai.NewNearbyNarrator(h.ai)
	aiResponse, err := narrator.GenerateNarration(results, categoryName)
	if err != nil {
		aiResponse = fmt.Sprintf("推薦你去 %s，距離 %s",
			results.Locations[0].Name,
			geo.FormatDistance(results.Locations[0].Distance))
	}

	// Get usage stats from context
	usageStats, _ := c.Get("usageStats")

	c.JSON(http.StatusOK, gin.H{
		"success":         true,
		"intentType":      "recommend",
		"recommendations": results.Locations[:min(3, len(results.Locations))],
		"aiResponse":      aiResponse,
		"usageStats":      usageStats,
	})
}

// min helper function
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}