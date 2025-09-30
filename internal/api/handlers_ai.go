package api

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"intelligent-spatial-platform/internal/geo"
)

// ChatWithAI handles AI chat with optional movement command processing
func (h *Handler) ChatWithAI(c *gin.Context) {
	var request struct {
		Message  string `json:"message"`
		Context  string `json:"context,omitempty"`
		PlayerID string `json:"playerId,omitempty"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// First, check if this might be a movement command
	if request.PlayerID != "" {
		// Get client info for movement command processing
		sessionID := c.GetHeader("X-Session-ID")
		if sessionID == "" {
			sessionID = "web_session_" + request.PlayerID
		}
		clientIP := c.ClientIP()

		// Try to process as movement command
		movementResult, err := h.game.ProcessAIMovementCommand(
			request.PlayerID,
			request.Message,
			sessionID,
			clientIP,
		)

		// If movement command was successfully processed
		if err == nil && movementResult.Success {
			c.JSON(http.StatusOK, gin.H{
				"type":     "movement",
				"data":     movementResult,
				"response": movementResult.Message,
			})
			return
		}

		// If rate limited, return error
		if err == nil && movementResult.RateLimited {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"type":     "movement",
				"data":     movementResult,
				"response": movementResult.Message,
			})
			return
		}
	}

	// Fall back to regular AI chat
	response, err := h.ai.Chat(request.Message, request.Context)
	if err != nil {
		// Log detailed error for debugging
		log.Printf("ERROR: AI chat failed - message: %s, error: %v", request.Message, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "AI service unavailable",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"response": response})
}

// ChatWithMovement handles enhanced chat with movement integration
func (h *Handler) ChatWithMovement(c *gin.Context) {
	var request struct {
		PlayerID string `json:"playerId" binding:"required"`
		Message  string `json:"message" binding:"required"`
		Context  string `json:"context,omitempty"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get player's current location
	player, err := h.game.GetPlayerStatus(request.PlayerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get player status"})
		return
	}

	currentLocation := &geo.Location{
		Latitude:  player.Latitude,
		Longitude: player.Longitude,
	}

	// Try to process as movement command first
	clientIP := c.ClientIP()
	sessionID := h.generateSessionID()

	movementResult, err := h.game.ProcessAIMovementCommand(
		request.PlayerID,
		request.Message,
		sessionID,
		clientIP,
	)

	// If successful movement, return movement response
	if err == nil && movementResult.Success {
		c.JSON(http.StatusOK, gin.H{
			"type": "movement",
			"data": movementResult,
		})
		return
	}

	// Otherwise, process as regular AI chat
	response, err := h.ai.ProcessVoiceCommand(request.Message, currentLocation)
	if err != nil {
		// Fallback to regular chat
		response, err = h.ai.Chat(request.Message, request.Context)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"type":     "chat",
		"response": response,
		"data": gin.H{
			"message": response,
		},
	})
}