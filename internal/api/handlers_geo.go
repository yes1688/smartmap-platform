package api

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"intelligent-spatial-platform/internal/geo"
)

// GetLocations retrieves all locations
func (h *Handler) GetLocations(c *gin.Context) {
	locations, err := h.geo.GetAllLocations()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": locations})
}

// CreateLocation creates a new location
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

// GetHistoricalSites retrieves all historical sites
func (h *Handler) GetHistoricalSites(c *gin.Context) {
	sites, err := h.geo.GetHistoricalSites()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": sites})
}

// SearchPlace searches for a place using geocoding service
func (h *Handler) SearchPlace(c *gin.Context) {
	var request struct {
		Query string `json:"query" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Use the geocoding service which now has Google Places fallback
	location, err := h.geo.GeocodeLocation(request.Query)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Location not found",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"name":      location.Name,
			"latitude":  location.Latitude,
			"longitude": location.Longitude,
		},
	})
}