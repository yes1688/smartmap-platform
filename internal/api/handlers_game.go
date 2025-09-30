package api

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"intelligent-spatial-platform/internal/geo"
)

// GetGameStatus retrieves player game status
func (h *Handler) GetGameStatus(c *gin.Context) {
	playerID := c.Query("playerId")
	if playerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "playerId is required"})
		return
	}

	status, err := h.game.GetPlayerStatus(playerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": status})
}

// GetPlayers retrieves all players
func (h *Handler) GetPlayers(c *gin.Context) {
	players, err := h.game.GetAllPlayers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": players})
}

// GetSessions retrieves all game sessions
func (h *Handler) GetSessions(c *gin.Context) {
	sessions, err := h.game.GetAllSessions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": sessions})
}

// CollectItem handles item collection by player
func (h *Handler) CollectItem(c *gin.Context) {
	var request struct {
		PlayerID string  `json:"playerId"`
		ItemID   string  `json:"itemId"`
		Lat      float64 `json:"lat"`
		Lng      float64 `json:"lng"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.game.CollectItem(request.PlayerID, request.ItemID, request.Lat, request.Lng)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// CreateSession creates a new game session
func (h *Handler) CreateSession(c *gin.Context) {
	var request struct {
		PlayerID string `json:"playerId"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	session, err := h.game.StartGameSession(request.PlayerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": session})
}

// MovePlayer handles player movement
func (h *Handler) MovePlayer(c *gin.Context) {
	var request struct {
		PlayerID string  `json:"playerId"`
		Lat      float64 `json:"lat"`
		Lng      float64 `json:"lng"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.game.MovePlayer(request.PlayerID, request.Lat, request.Lng); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	nearbyHistoricalSite, err := h.geo.GetNearbyHistoricalSite(request.Lat, request.Lng, 100.0)
	if err == nil && nearbyHistoricalSite != nil {
		introduction, _ := h.ai.GenerateHistoricalSiteIntroduction(nearbyHistoricalSite)
		c.JSON(http.StatusOK, gin.H{
			"success":        true,
			"historicalSite": nearbyHistoricalSite,
			"aiIntroduction": introduction,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// AIMovement handles AI-controlled movement
func (h *Handler) AIMovement(c *gin.Context) {
	var request struct {
		PlayerID  string `json:"playerId" binding:"required"`
		Command   string `json:"command" binding:"required"`
		SessionID string `json:"sessionId,omitempty"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get client IP for audit logging
	clientIP := c.ClientIP()
	if request.SessionID == "" {
		request.SessionID = h.generateSessionID()
	}

	// Process AI movement command with security controls
	result, err := h.game.ProcessAIMovementCommand(
		request.PlayerID,
		request.Command,
		request.SessionID,
		clientIP,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return different HTTP status based on result
	var status int
	if result.Success {
		status = http.StatusOK
	} else if result.RateLimited {
		status = http.StatusTooManyRequests
	} else {
		status = http.StatusBadRequest
	}

	c.JSON(status, gin.H{"data": result})
}

// GetMovementStats retrieves movement statistics for a player
func (h *Handler) GetMovementStats(c *gin.Context) {
	playerID := c.Query("playerId")
	if playerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "playerId is required"})
		return
	}

	stats := h.game.GetMovementStats(playerID)
	c.JSON(http.StatusOK, gin.H{"data": stats})
}

// DebugMovement handles debug movement for testing
func (h *Handler) DebugMovement(c *gin.Context) {
	var request struct {
		PlayerID string `json:"playerId" binding:"required"`
		Command  string `json:"command" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get player
	player, err := h.game.GetPlayerStatus(request.PlayerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Player not found"})
		return
	}

	currentLocation := &geo.Location{
		Latitude:  player.Latitude,
		Longitude: player.Longitude,
	}

	// Try to directly test movement parsing
	result, err := h.game.ProcessAIMovementCommand(
		request.PlayerID,
		request.Command,
		"debug_session",
		c.ClientIP(),
	)

	debugInfo := gin.H{
		"input": gin.H{
			"playerId":        request.PlayerID,
			"command":         request.Command,
			"currentLocation": currentLocation,
		},
		"result": result,
		"error":  nil,
	}

	if err != nil {
		debugInfo["error"] = err.Error()
	}

	c.JSON(http.StatusOK, debugInfo)
}

// generateSessionID generates a unique session ID
func (h *Handler) generateSessionID() string {
	return fmt.Sprintf("session_%d", time.Now().UnixNano())
}