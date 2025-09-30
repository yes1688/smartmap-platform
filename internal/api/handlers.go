package api

import (
	"gorm.io/gorm"

	"intelligent-spatial-platform/internal/ai"
	"intelligent-spatial-platform/internal/game"
	"intelligent-spatial-platform/internal/geo"
	"intelligent-spatial-platform/internal/voice"
)

// Handler manages all API handlers with service dependencies
type Handler struct {
	db    *gorm.DB
	ai    *ai.Service
	game  *game.Service
	geo   *geo.Service
	voice *voice.Service
}

// NewHandler creates a new handler with all service dependencies
func NewHandler(db *gorm.DB, ai *ai.Service, game *game.Service, geo *geo.Service, voice *voice.Service) *Handler {
	return &Handler{
		db:    db,
		ai:    ai,
		game:  game,
		geo:   geo,
		voice: voice,
	}
}