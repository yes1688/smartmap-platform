package geo

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type GeocodingService struct {
	client *http.Client
	baseURL string
	googlePlaces *GooglePlacesService
}

type NominatimResponse []struct {
	Lat         string `json:"lat"`
	Lon         string `json:"lon"`
	DisplayName string `json:"display_name"`
	PlaceID     int    `json:"place_id"`
	Type        string `json:"type"`
	Class       string `json:"class"`
}

func NewGeocodingService() (*GeocodingService, error) {
	// Initialize Google Places (optional - will be nil if API key not set)
	googlePlaces, err := NewGooglePlacesService()
	if err != nil {
		fmt.Printf("Warning: Google Places API not available: %v\n", err)
		googlePlaces = nil
	}

	return &GeocodingService{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		baseURL: "https://nominatim.openstreetmap.org/search",
		googlePlaces: googlePlaces,
	}, nil
}

func (g *GeocodingService) GeocodeLocation(locationName string) (*Location, error) {
	// Use Google Places API only (most accurate for Taiwan locations)
	if g.googlePlaces != nil {
		fmt.Printf("🔍 Using Google Places API for: %s\n", locationName)
		location, err := g.googlePlaces.SearchPlace(locationName)
		if err == nil {
			fmt.Printf("✅ Google Places found location: %s\n", location.Name)
			return location, nil
		}
		fmt.Printf("❌ Google Places failed: %v\n", err)
		return nil, fmt.Errorf("failed to find location: %s", locationName)
	}

	return nil, fmt.Errorf("Google Places API not available")
}

func (g *GeocodingService) tryNominatim(locationName string) (*Location, error) {
	// Add Taiwan context to improve accuracy for Taiwan locations
	query := locationName
	if !strings.Contains(strings.ToLower(locationName), "taiwan") &&
		!strings.Contains(strings.ToLower(locationName), "台灣") {
		query = locationName + ", Taiwan"
	}

	// Prepare URL with parameters
	params := url.Values{}
	params.Set("q", query)
	params.Set("format", "json")
	params.Set("limit", "5")
	params.Set("countrycodes", "tw") // Limit to Taiwan
	params.Set("addressdetails", "1")

	requestURL := fmt.Sprintf("%s?%s", g.baseURL, params.Encode())

	// Create request with proper User-Agent (required by Nominatim)
	req, err := http.NewRequest("GET", requestURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}
	req.Header.Set("User-Agent", "IntelligentSpatialPlatform/1.0 (contact@example.com)")

	// Make request
	resp, err := g.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("geocoding request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("geocoding API returned status: %d", resp.StatusCode)
	}

	// Parse response
	var results NominatimResponse
	if err := json.NewDecoder(resp.Body).Decode(&results); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	if len(results) == 0 {
		return nil, fmt.Errorf("no results found for location: %s", locationName)
	}

	// Use the first result
	result := results[0]

	// Parse coordinates
	lat, err := parseFloat(result.Lat)
	if err != nil {
		return nil, fmt.Errorf("invalid latitude: %v", err)
	}

	lng, err := parseFloat(result.Lon)
	if err != nil {
		return nil, fmt.Errorf("invalid longitude: %v", err)
	}

	location := &Location{
		Latitude:  lat,
		Longitude: lng,
		Name:      result.DisplayName,
	}

	// Validate that the location is within Taiwan bounds
	if !IsWithinTaiwan(location.Latitude, location.Longitude) {
		return nil, fmt.Errorf("location %s is outside Taiwan boundaries", locationName)
	}

	return location, nil
}

func parseFloat(s string) (float64, error) {
	// Simple float parsing
	var f float64
	_, err := fmt.Sscanf(s, "%f", &f)
	return f, err
}

func (g *GeocodingService) Close() {
	// HTTP client doesn't require explicit closing
}