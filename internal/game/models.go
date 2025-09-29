package game

import (
	"time"
)

type Player struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name" gorm:"not null"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Score     int       `json:"score" gorm:"default:0"`
	Level     int       `json:"level" gorm:"default:1"`
	IsActive  bool      `json:"isActive" gorm:"default:true"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Item struct {
	ID          string    `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description"`
	ItemType    string    `json:"itemType" gorm:"not null"` // treasure, artifact, bonus
	Value       int       `json:"value" gorm:"default:10"`
	Rarity      string    `json:"rarity" gorm:"default:common"` // common, rare, legendary
	Latitude    float64   `json:"latitude"`
	Longitude   float64   `json:"longitude"`
	IsCollected bool      `json:"isCollected" gorm:"default:false"`
	CollectedBy string    `json:"collectedBy"`
	SpawnedAt   time.Time `json:"spawnedAt"`
	CollectedAt *time.Time `json:"collectedAt"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type GameSession struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	PlayerID  string    `json:"playerId" gorm:"not null"`
	StartTime time.Time `json:"startTime"`
	EndTime   *time.Time `json:"endTime"`
	Score     int       `json:"score" gorm:"default:0"`
	Duration  int       `json:"duration"` // in seconds
	ItemsCollected int  `json:"itemsCollected" gorm:"default:0"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	Player Player `json:"player" gorm:"foreignKey:PlayerID"`
}

type PlayerStats struct {
	PlayerID       string `json:"playerId"`
	TotalScore     int    `json:"totalScore"`
	TotalSessions  int    `json:"totalSessions"`
	TotalItems     int    `json:"totalItems"`
	AverageScore   float64 `json:"averageScore"`
	BestScore      int    `json:"bestScore"`
	TotalPlayTime  int    `json:"totalPlayTime"` // in seconds
	LastPlayed     *time.Time `json:"lastPlayed"`
}