package main

import "fmt"

// Taiwan boundary for safety checks
type Bounds struct {
	North float64
	South float64
	East  float64
	West  float64
}

var taiwanBounds = &Bounds{
	North: 25.3,
	South: 22.0,
	East:  122.0,
	West:  120.0,
}

func isWithinTaiwanBounds(lat, lng float64) bool {
	return lat >= taiwanBounds.South &&
		   lat <= taiwanBounds.North &&
		   lng >= taiwanBounds.West &&
		   lng <= taiwanBounds.East
}

func main() {
	// 台大座標
	ntuLat := 25.0174
	ntuLng := 121.5392

	fmt.Printf("台大座標: lat=%.4f, lng=%.4f\n", ntuLat, ntuLng)
	fmt.Printf("台灣邊界: North=%.1f, South=%.1f, East=%.1f, West=%.1f\n",
		taiwanBounds.North, taiwanBounds.South, taiwanBounds.East, taiwanBounds.West)
	fmt.Printf("台大在台灣邊界內: %v\n", isWithinTaiwanBounds(ntuLat, ntuLng))

	// 墾丁座標
	kentingLat := 21.9518
	kentingLng := 120.7977

	fmt.Printf("\n墾丁座標: lat=%.4f, lng=%.4f\n", kentingLat, kentingLng)
	fmt.Printf("墾丁在台灣邊界內: %v\n", isWithinTaiwanBounds(kentingLat, kentingLng))
}