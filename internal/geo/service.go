package geo

import (
	"fmt"
	"math"

	"gorm.io/gorm"
)

type Service struct {
	db        *gorm.DB
	geocoding *GeocodingService
}

func NewService(db *gorm.DB) *Service {
	// Initialize geocoding service
	geocoding, err := NewGeocodingService()
	if err != nil {
		fmt.Printf("Warning: Failed to initialize geocoding service: %v\n", err)
		geocoding = nil
	}

	return &Service{
		db:        db,
		geocoding: geocoding,
	}
}

// GetGeocoding returns the geocoding service
func (s *Service) GetGeocoding() *GeocodingService {
	return s.geocoding
}

func (s *Service) GetAllLocations() ([]Location, error) {
	var locations []Location
	err := s.db.Find(&locations).Error
	return locations, err
}

func (s *Service) CreateLocation(location *Location) error {
	return s.db.Create(location).Error
}

func (s *Service) GetLocationByID(id uint) (*Location, error) {
	var location Location
	err := s.db.First(&location, id).Error
	if err != nil {
		return nil, err
	}
	return &location, nil
}

func (s *Service) GetHistoricalSites() ([]HistoricalSite, error) {
	var sites []HistoricalSite
	err := s.db.Where("is_active = true").Find(&sites).Error
	return sites, err
}

func (s *Service) GetNearbyHistoricalSite(lat, lng, radiusMeters float64) (*HistoricalSite, error) {
	var site HistoricalSite

	query := `
		SELECT *, ST_Distance(
			ST_GeogFromText('POINT(' || longitude || ' ' || latitude || ')'),
			ST_GeogFromText('POINT(' || ? || ' ' || ? || ')')
		) as distance
		FROM historical_sites
		WHERE is_active = true
		AND ST_DWithin(
			ST_GeogFromText('POINT(' || longitude || ' ' || latitude || ')'),
			ST_GeogFromText('POINT(' || ? || ' ' || ? || ')'),
			?
		)
		ORDER BY distance
		LIMIT 1
	`

	err := s.db.Raw(query, lng, lat, lng, lat, radiusMeters).Scan(&site).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	if site.ID == 0 {
		return nil, nil
	}

	s.db.Model(&site).UpdateColumn("visit_count", gorm.Expr("visit_count + 1"))

	return &site, nil
}

func (s *Service) CreateHistoricalSite(site *HistoricalSite) error {
	return s.db.Create(site).Error
}

func (s *Service) SearchNearbyLocations(lat, lng, radiusKm float64, locationType string) ([]Location, error) {
	var locations []Location

	query := s.db.Model(&Location{})

	if locationType != "" {
		query = query.Where("type = ?", locationType)
	}

	query = query.Where(
		"ST_DWithin(ST_GeogFromText('POINT(' || longitude || ' ' || latitude || ')'), ST_GeogFromText(?), ?)",
		fmt.Sprintf("POINT(%f %f)", lng, lat), radiusKm*1000,
	)

	query = query.Order(
		fmt.Sprintf("ST_Distance(ST_GeogFromText('POINT(' || longitude || ' ' || latitude || ')'), ST_GeogFromText('POINT(%f %f)'))", lng, lat),
	)

	err := query.Find(&locations).Error
	return locations, err
}

func (s *Service) CalculateRoute(startLat, startLng, endLat, endLng float64) (*Route, error) {
	distance := calculateDistance(startLat, startLng, endLat, endLng)
	duration := int(distance / 5 * 60) // Assume walking speed of 5 km/h

	route := &Route{
		Name:        fmt.Sprintf("Route from (%.6f, %.6f) to (%.6f, %.6f)", startLat, startLng, endLat, endLng),
		Description: "Auto-generated route",
		StartLat:    startLat,
		StartLng:    startLng,
		EndLat:      endLat,
		EndLng:      endLng,
		Distance:    distance,
		Duration:    duration,
	}

	if err := s.db.Create(route).Error; err != nil {
		return nil, err
	}

	return route, nil
}

func (s *Service) GetGeoFeatures(bounds map[string]float64) ([]GeoFeature, error) {
	var features []GeoFeature

	var locations []Location
	err := s.db.Where(
		"latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?",
		bounds["south"], bounds["north"], bounds["west"], bounds["east"],
	).Find(&locations).Error

	if err != nil {
		return nil, err
	}

	for _, location := range locations {
		feature := GeoFeature{
			Type: "Feature",
			Properties: map[string]interface{}{
				"id":      location.ID,
				"name":    location.Name,
				"address": location.Address,
				"type":    location.Type,
			},
			Geometry: Geometry{
				Type:        "Point",
				Coordinates: []float64{location.Longitude, location.Latitude},
			},
		}
		features = append(features, feature)
	}

	return features, nil
}

// GeocodeLocation searches for a location using the geocoding service
func (s *Service) GeocodeLocation(locationName string) (*Location, error) {
	if s.geocoding == nil {
		return nil, fmt.Errorf("geocoding service not available")
	}

	return s.geocoding.GeocodeLocation(locationName)
}

func calculateDistance(lat1, lng1, lat2, lng2 float64) float64 {
	const R = 6371000 // Earth's radius in meters

	lat1Rad := lat1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	deltaLatRad := (lat2 - lat1) * math.Pi / 180
	deltaLngRad := (lng2 - lng1) * math.Pi / 180

	a := math.Sin(deltaLatRad/2)*math.Sin(deltaLatRad/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(deltaLngRad/2)*math.Sin(deltaLngRad/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return R * c
}