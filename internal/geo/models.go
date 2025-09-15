package geo

import (
	"time"
)

type Location struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name" gorm:"not null"`
	Latitude  float64   `json:"latitude" gorm:"not null"`
	Longitude float64   `json:"longitude" gorm:"not null"`
	Address   string    `json:"address"`
	Type      string    `json:"type"` // poi, landmark, historical_site, etc.
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type HistoricalSite struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description" gorm:"type:text"`
	Era         string    `json:"era"`
	Latitude    float64   `json:"latitude" gorm:"not null"`
	Longitude   float64   `json:"longitude" gorm:"not null"`
	Address     string    `json:"address"`
	Images      []string  `json:"images" gorm:"type:text[]"`
	AudioGuide  string    `json:"audioGuide"`
	IsActive    bool      `json:"isActive" gorm:"default:true"`
	VisitCount  int       `json:"visitCount" gorm:"default:0"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Route struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description"`
	StartLat    float64   `json:"startLat"`
	StartLng    float64   `json:"startLng"`
	EndLat      float64   `json:"endLat"`
	EndLng      float64   `json:"endLng"`
	Waypoints   []Waypoint `json:"waypoints" gorm:"foreignKey:RouteID"`
	Distance    float64   `json:"distance"` // in meters
	Duration    int       `json:"duration"` // in seconds
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Waypoint struct {
	ID        uint    `json:"id" gorm:"primaryKey"`
	RouteID   uint    `json:"routeId"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Order     int     `json:"order"`
	Name      string  `json:"name"`
}

type GeoFeature struct {
	Type       string                 `json:"type"`
	Properties map[string]interface{} `json:"properties"`
	Geometry   Geometry               `json:"geometry"`
}

type Geometry struct {
	Type        string      `json:"type"`
	Coordinates interface{} `json:"coordinates"`
}

type Bounds struct {
	North float64 `json:"north"`
	South float64 `json:"south"`
	East  float64 `json:"east"`
	West  float64 `json:"west"`
}