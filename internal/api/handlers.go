package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"intelligent-spatial-platform/internal/ai"
	"intelligent-spatial-platform/internal/game"
	"intelligent-spatial-platform/internal/geo"
	"intelligent-spatial-platform/internal/voice"
)

type Handler struct {
	db    *gorm.DB
	ai    *ai.Service
	game  *game.Service
	geo   *geo.Service
	voice *voice.Service
}

func NewHandler(db *gorm.DB, ai *ai.Service, game *game.Service, geo *geo.Service, voice *voice.Service) *Handler {
	return &Handler{
		db:    db,
		ai:    ai,
		game:  game,
		geo:   geo,
		voice: voice,
	}
}

func (h *Handler) GetLocations(c *gin.Context) {
	locations, err := h.geo.GetAllLocations()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": locations})
}

func (h *Handler) CreateLocation(c *gin.Context) {
	var location geo.Location
	if err := c.ShouldBindJSON(&location); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.geo.CreateLocation(&location); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": location})
}

func (h *Handler) GetHistoricalSites(c *gin.Context) {
	sites, err := h.geo.GetHistoricalSites()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": sites})
}

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

func (h *Handler) ChatWithAI(c *gin.Context) {
	var request struct {
		Message string `json:"message"`
		Context string `json:"context,omitempty"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.ai.Chat(request.Message, request.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"response": response})
}

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

func (h *Handler) GetPlayers(c *gin.Context) {
	players, err := h.game.GetAllPlayers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": players})
}

func (h *Handler) GetSessions(c *gin.Context) {
	sessions, err := h.game.GetAllSessions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": sessions})
}

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
			"success":           true,
			"historicalSite":    nearbyHistoricalSite,
			"aiIntroduction":    introduction,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}