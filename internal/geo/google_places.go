package geo

import (
	"encoding/json"
	"fmt"
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
		apiKey: apiKey,
		baseURL: "https://maps.googleapis.com/maps/api/place/textsearch/json",
	}, nil
}

func (g *GooglePlacesService) SearchPlace(query string) (*Location, error) {
	// Prepare URL with parameters
	params := url.Values{}
	params.Set("query", query+" Taiwan") // Add Taiwan context
	params.Set("key", g.apiKey)
	params.Set("region", "tw") // Taiwan region bias
	params.Set("language", "zh-TW") // Traditional Chinese

	requestURL := fmt.Sprintf("%s?%s", g.baseURL, params.Encode())

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