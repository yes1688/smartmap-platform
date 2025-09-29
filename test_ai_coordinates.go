package main

import "fmt"

type Bounds struct {
	North float64
	South float64
	East  float64
	West  float64
}

var taiwanBounds = &Bounds{
	North: 25.5,
	South: 21.8,
	East:  122.2,
	West:  119.8,
}

func isWithinTaiwanBounds(lat, lng float64) bool {
	return lat >= taiwanBounds.South &&
		   lat <= taiwanBounds.North &&
		   lng >= taiwanBounds.West &&
		   lng <= taiwanBounds.East
}

func calculateDistance(lat1, lng1, lat2, lng2 float64) float64 {
	// 簡化的距離計算 (大概估算)
	latDiff := lat1 - lat2
	lngDiff := lng1 - lng2
	return (latDiff*latDiff + lngDiff*lngDiff) * 111000 // 大概轉換為米
}

func main() {
	// AI 返回的座標
	aiLat := 24.9253
	aiLng := 120.9732

	// 當前玩家位置
	currentLat := 25.033000
	currentLng := 121.565400

	fmt.Printf("AI 回應座標: lat=%.4f, lng=%.4f\n", aiLat, aiLng)
	fmt.Printf("在台灣邊界內: %v\n", isWithinTaiwanBounds(aiLat, aiLng))

	distance := calculateDistance(currentLat, currentLng, aiLat, aiLng)
	fmt.Printf("與當前位置距離: %.0f 米\n", distance)
	fmt.Printf("是否超過50km限制: %v\n", distance > 50000)
}