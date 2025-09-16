package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"intelligent-spatial-platform/internal/geo"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: Could not load .env file: %v", err)
	}

	fmt.Println("🧪 Testing Google Places API Integration...")
	fmt.Printf("API Key: %s\n", os.Getenv("GOOGLE_PLACES_API_KEY")[:20]+"...")

	// Test Google Places service directly
	places, err := geo.NewGooglePlacesService()
	if err != nil {
		log.Fatalf("❌ Failed to create Google Places service: %v", err)
	}

	// Test with 劉家湯圓
	testQueries := []string{
		"劉家湯圓",
		"台北101",
		"士林夜市",
		"微風廣場",
	}

	for _, query := range testQueries {
		fmt.Printf("\n🔍 Testing: %s\n", query)

		location, err := places.SearchPlace(query)
		if err != nil {
			fmt.Printf("❌ Error: %v\n", err)
			continue
		}

		fmt.Printf("✅ Found: %s\n", location.Name)
		fmt.Printf("📍 Coordinates: %.6f, %.6f\n", location.Latitude, location.Longitude)
	}

	// Test the full geocoding service (with fallback)
	fmt.Printf("\n🔄 Testing full geocoding service with fallback...\n")

	geocoding, err := geo.NewGeocodingService()
	if err != nil {
		log.Fatalf("❌ Failed to create geocoding service: %v", err)
	}

	// Test with a location that Nominatim might not find
	testLocation := "劉家湯圓"
	fmt.Printf("\n🎯 Full test: %s\n", testLocation)

	result, err := geocoding.GeocodeLocation(testLocation)
	if err != nil {
		fmt.Printf("❌ Geocoding failed: %v\n", err)
	} else {
		fmt.Printf("✅ Success: %s\n", result.Name)
		fmt.Printf("📍 Coordinates: %.6f, %.6f\n", result.Latitude, result.Longitude)
	}

	fmt.Println("\n🎉 Test completed!")
}