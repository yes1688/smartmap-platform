package geo

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"net/url"
	"os"
	"time"
)

type GooglePlacesService struct {
	client *http.Client
	apiKey string
	baseURL string
}

type GooglePlacesResponse struct {
	Results []struct {
		Name     string `json:"name"`
		PlaceID  string `json:"place_id"`
		Geometry struct {
			Location struct {
				Lat float64 `json:"lat"`
				Lng float64 `json:"lng"`
			} `json:"location"`
		} `json:"geometry"`
		FormattedAddress string   `json:"formatted_address"`
		Types            []string `json:"types"`
	} `json:"results"`
	Status string `json:"status"`
}

func NewGooglePlacesService() (*GooglePlacesService, error) {
	apiKey := os.Getenv("GOOGLE_PLACES_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GOOGLE_PLACES_API_KEY environment variable not set")
	}

	return &GooglePlacesService{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		apiKey:  apiKey,
		baseURL: "https://maps.googleapis.com/maps/api/place",
	}, nil
}

func (g *GooglePlacesService) SearchPlace(query string) (*Location, error) {
	// Prepare URL with parameters
	params := url.Values{}
	params.Set("query", query+" Taiwan") // Add Taiwan context
	params.Set("key", g.apiKey)
	params.Set("region", "tw") // Taiwan region bias
	params.Set("language", "zh-TW") // Traditional Chinese

	requestURL := fmt.Sprintf("%s/textsearch/json?%s", g.baseURL, params.Encode())

	// Create request
	req, err := http.NewRequest("GET", requestURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Make request
	resp, err := g.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("google places request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("google places API returned status: %d", resp.StatusCode)
	}

	// Parse response
	var result GooglePlacesResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	// Check API response status
	if result.Status != "OK" {
		return nil, fmt.Errorf("google places API error: %s", result.Status)
	}

	if len(result.Results) == 0 {
		return nil, fmt.Errorf("no results found for: %s", query)
	}

	// Use the first result
	place := result.Results[0]

	location := &Location{
		Latitude:  place.Geometry.Location.Lat,
		Longitude: place.Geometry.Location.Lng,
		Name:      place.FormattedAddress,
	}

	// Validate that the location is within Taiwan bounds
	if !IsWithinTaiwan(location.Latitude, location.Longitude) {
		return nil, fmt.Errorf("location %s is outside Taiwan boundaries", query)
	}

	return location, nil
}

// SearchNearbyPlaces 搜尋附近地點（使用 Google Places API Nearby Search）
func (g *GooglePlacesService) SearchNearbyPlaces(lat, lng float64, category string, radiusMeters int, limit int) ([]LocationWithDistance, error) {
	// Map category to Google Places type
	placeType := mapCategoryToGoogleType(category)

	// Prepare URL with parameters
	params := url.Values{}
	params.Set("location", fmt.Sprintf("%.6f,%.6f", lat, lng))
	params.Set("radius", fmt.Sprintf("%d", radiusMeters))
	if placeType != "" {
		params.Set("type", placeType)
	}
	params.Set("key", g.apiKey)
	params.Set("language", "zh-TW")

	requestURL := fmt.Sprintf("%s/nearbysearch/json?%s", g.baseURL, params.Encode())

	// Create request
	req, err := http.NewRequest("GET", requestURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Make request
	resp, err := g.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("google places request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("google places API returned status: %d", resp.StatusCode)
	}

	// Parse response
	var result GooglePlacesResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	// Check API response status
	if result.Status != "OK" && result.Status != "ZERO_RESULTS" {
		return nil, fmt.Errorf("google places API error: %s", result.Status)
	}

	if len(result.Results) == 0 {
		return []LocationWithDistance{}, nil
	}

	// Convert results to LocationWithDistance
	locations := []LocationWithDistance{}
	maxResults := limit
	if maxResults == 0 || maxResults > len(result.Results) {
		maxResults = len(result.Results)
	}

	for i := 0; i < maxResults; i++ {
		place := result.Results[i]

		// Calculate distance using Haversine formula
		distance := calculateDistanceInMeters(
			lat, lng,
			place.Geometry.Location.Lat, place.Geometry.Location.Lng,
		)

		locations = append(locations, LocationWithDistance{
			Location: Location{
				Name:      place.Name,
				Latitude:  place.Geometry.Location.Lat,
				Longitude: place.Geometry.Location.Lng,
				Address:   place.FormattedAddress,
				Type:      category, // Use Type field instead of Category
			},
			Distance: distance,
		})
	}

	return locations, nil
}

// mapCategoryToGoogleType 將內部類別對應到 Google Places API 的 type
func mapCategoryToGoogleType(category string) string {
	typeMap := map[string]string{
		"restaurant": "restaurant",
		"cafe":       "cafe",
		"attraction": "tourist_attraction",
		"hotel":      "lodging",
		"park":       "park",
		"museum":     "museum",
		"general":    "",
	}

	if googleType, ok := typeMap[category]; ok {
		return googleType
	}
	return ""
}

// calculateDistanceInMeters 使用 Haversine 公式計算兩點距離（米）
func calculateDistanceInMeters(lat1, lng1, lat2, lng2 float64) float64 {
	const earthRadiusKm = 6371.0

	// Convert degrees to radians
	lat1Rad := lat1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	deltaLat := (lat2 - lat1) * math.Pi / 180
	deltaLng := (lng2 - lng1) * math.Pi / 180

	// Haversine formula
	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(deltaLng/2)*math.Sin(deltaLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	// Distance in meters
	return earthRadiusKm * c * 1000
}