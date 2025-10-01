package geo

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

// LocationWithDistance 帶距離的地點
type LocationWithDistance struct {
	Location
	Distance float64 `json:"distance"` // 距離（米）
	Bearing  float64 `json:"bearing"`  // 方位角（度）
}

// NearbySearchResult 附近搜尋結果
type NearbySearchResult struct {
	Locations    []LocationWithDistance `json:"locations"`
	Total        int                    `json:"total"`
	Radius       float64                `json:"radius"`
	Center       *Location              `json:"center"`
	Source       string                 `json:"source"`       // database, google_api, hybrid
	Warning      string                 `json:"warning,omitempty"`
	AIResponse   string                 `json:"aiResponse"`   // AI 口語化描述
}

// NearbySearchService 附近搜尋服務
type NearbySearchService struct {
	db           *gorm.DB
	geocoding    *GeocodingService
	googlePlaces *GooglePlacesService
}

func NewNearbySearchService(db *gorm.DB, geocoding *GeocodingService) *NearbySearchService {
	// Initialize Google Places service
	googlePlaces, err := NewGooglePlacesService()
	if err != nil {
		log.Printf("⚠️ Failed to initialize Google Places: %v", err)
		googlePlaces = nil
	}

	return &NearbySearchService{
		db:           db,
		geocoding:    geocoding,
		googlePlaces: googlePlaces,
	}
}

// SearchNearby 搜尋附近地點（使用 Google Places API）
func (s *NearbySearchService) SearchNearby(
	centerLat, centerLng float64,
	category string,
	radiusMeters float64,
	limit int,
) (*NearbySearchResult, error) {

	if limit == 0 {
		limit = 20 // 預設返回 20 個結果
	}

	// 使用 Google Places API 搜尋
	if s.googlePlaces == nil {
		return nil, fmt.Errorf("Google Places API not available")
	}

	log.Printf("🔍 Using Google Places API to search nearby: lat=%.6f, lng=%.6f, category=%s, radius=%.0fm",
		centerLat, centerLng, category, radiusMeters)

	results, err := s.googlePlaces.SearchNearbyPlaces(
		centerLat, centerLng,
		category,
		int(radiusMeters),
		limit,
	)

	if err != nil {
		return nil, fmt.Errorf("Google Places API 查詢失敗: %v", err)
	}

	log.Printf("✅ Google Places API 查詢成功：找到 %d 個結果（類別: %s，半徑: %.0fm）",
		len(results), category, radiusMeters)

	return &NearbySearchResult{
		Locations: results,
		Total:     len(results),
		Radius:    radiusMeters,
		Center: &Location{
			Latitude:  centerLat,
			Longitude: centerLng,
		},
		Source: "google_api",
	}, nil
}

// SearchNearbyByType 依類型搜尋（快捷方法）
func (s *NearbySearchService) SearchNearbyRestaurants(lat, lng float64, radius float64) (*NearbySearchResult, error) {
	return s.SearchNearby(lat, lng, "restaurant", radius, 10)
}

func (s *NearbySearchService) SearchNearbyAttractions(lat, lng float64, radius float64) (*NearbySearchResult, error) {
	return s.SearchNearby(lat, lng, "attraction", radius, 10)
}

func (s *NearbySearchService) SearchNearbyCafes(lat, lng float64, radius float64) (*NearbySearchResult, error) {
	return s.SearchNearby(lat, lng, "cafe", radius, 10)
}

// GetDirectionDescription 將方位角轉換為中文方向描述
func GetDirectionDescription(bearing float64) string {
	// 將 0-360 度轉換為八個方位
	directions := []string{"北", "東北", "東", "東南", "南", "西南", "西", "西北"}
	index := int((bearing + 22.5) / 45.0) % 8
	return directions[index]
}

// FormatDistance 格式化距離顯示
func FormatDistance(meters float64) string {
	if meters < 1000 {
		return fmt.Sprintf("%.0f公尺", meters)
	}
	return fmt.Sprintf("%.1f公里", meters/1000)
}
