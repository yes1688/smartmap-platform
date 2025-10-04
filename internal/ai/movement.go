package ai

import (
	"fmt"
	"math"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"intelligent-spatial-platform/internal/geo"
)

type MovementCommandParser struct {
	aiService        *Service
	geocodingService *geo.GeocodingService
	bounds           *geo.Bounds
}

type MovementCommand struct {
	Type           string                 `json:"type"`           // move, explore, go_to, follow_route
	Action         string                 `json:"action"`         // absolute_move, relative_move, direction_move
	Destination    *geo.Location          `json:"destination"`    // target coordinates
	Direction      string                 `json:"direction"`      // north, south, east, west, northeast, etc
	Distance       float64                `json:"distance"`       // in meters
	Speed          string                 `json:"speed"`          // slow, normal, fast
	Parameters     map[string]interface{} `json:"parameters"`     // additional parameters
	OriginalText   string                 `json:"originalText"`   // user input
	Confidence     float64                `json:"confidence"`     // parsing confidence 0-1
	SafetyChecked  bool                   `json:"safetyChecked"`  // security validation passed
	EstimatedTime  int                    `json:"estimatedTime"`  // seconds to complete
	RequiresAI     bool                   `json:"requiresAI"`     // needs AI interpretation
}

// Taiwan boundary for safety checks (擴大範圍以包含墾丁等地點)
var taiwanBounds = &geo.Bounds{
	North: 25.5,  // 擴大北邊界
	South: 21.8,  // 擴大南邊界以包含墾丁 (21.9518)
	East:  122.2, // 擴大東邊界
	West:  119.8, // 擴大西邊界
}

func NewMovementCommandParser(aiService *Service, geocodingService *geo.GeocodingService) *MovementCommandParser {
	return &MovementCommandParser{
		aiService:        aiService,
		geocodingService: geocodingService,
		bounds:          taiwanBounds,
	}
}

func (p *MovementCommandParser) ParseMovementCommand(text string, currentLocation *geo.Location) (*MovementCommand, error) {
	text = strings.TrimSpace(text)

	command := &MovementCommand{
		OriginalText:  text,
		Parameters:    make(map[string]interface{}),
		Speed:         "normal",
		SafetyChecked: false,
		RequiresAI:    false,
	}

	// Detect if this is a movement command
	if !p.isMovementCommand(text) {
		return nil, fmt.Errorf("not a movement command")
	}

	// Parse direct coordinates (highest confidence)
	if coords := p.parseDirectCoordinates(text); coords != nil {
		// Check if this is a special marker for place name resolution
		if coords.Latitude == 999.0 && coords.Longitude == 999.0 {
			// Extract place name from Google Maps URL and use geocoding to resolve coordinates
			placeName := p.extractPlaceNameFromURL(text)
			if placeName != "" {
				command.RequiresAI = false
				geoLocation, err := p.resolveLocationWithGeocoding(placeName)
				if err != nil {
					return nil, fmt.Errorf("failed to resolve Google Maps place URL location with geocoding: %v", err)
				}

				command.Type = "move"
				command.Action = "absolute_move"
				command.Destination = geoLocation
				command.Parameters = map[string]interface{}{
					"placeName": placeName,
					"originalURL": text,
				}
				command.Confidence = 0.8 // Slightly lower confidence as it needs AI resolution
				return p.validateAndEnrichCommand(command, currentLocation)
			}
		} else {
			// Regular coordinates
			command.Type = "move"
			command.Action = "absolute_move"
			command.Destination = coords
			command.Confidence = 0.9
			return p.validateAndEnrichCommand(command, currentLocation)
		}
	}

	// Parse named locations using geocoding (HIGHEST PRIORITY)
	if p.containsLocationName(text) {
		// Extract the actual location name from the movement command
		locationName := p.extractLocationFromCommand(text)
		if locationName != "" {
			command.RequiresAI = false
			geoLocation, err := p.resolveLocationWithGeocoding(locationName)
			if err != nil {
				return nil, fmt.Errorf("failed to resolve location with geocoding: %v", err)
			}

			command.Type = "go_to"
			command.Action = "absolute_move"
			command.Destination = geoLocation
			command.Confidence = 0.9 // Highest confidence for named locations
			return p.validateAndEnrichCommand(command, currentLocation)
		}
	}

	// Parse direction and distance (lower priority)
	if direction, distance := p.parseDirectionDistance(text); direction != "" {
		command.Type = "move"
		command.Action = "direction_move"
		command.Direction = direction
		command.Distance = distance
		command.Confidence = 0.7
		return p.validateAndEnrichCommand(command, currentLocation)
	}

	// Parse relative movements
	if relativeMove := p.parseRelativeMovement(text); relativeMove != nil {
		command.Type = "move"
		command.Action = "relative_move"
		command.Destination = relativeMove
		command.Confidence = 0.6
		return p.validateAndEnrichCommand(command, currentLocation)
	}

	return nil, fmt.Errorf("unable to parse movement command")
}

func (p *MovementCommandParser) isMovementCommand(text string) bool {
	movementKeywords := []string{
		// Chinese movement terms
		"移動", "去", "前往", "到", "走", "跑", "移動到", "帶我去", "導航到",
		"向前", "向後", "向左", "向右", "往北", "往南", "往東", "往西",
		"北邊", "南邊", "東邊", "西邊", "東北", "西北", "東南", "西南",

		// English movement terms
		"move", "go", "walk", "run", "navigate", "travel", "head",
		"north", "south", "east", "west", "northeast", "northwest",
		"southeast", "southwest", "forward", "backward", "left", "right",

		// Distance indicators
		"公尺", "米", "公里", "meter", "meters", "km", "kilometer",
		"步", "steps", "距離", "distance",

		// Location indicators
		"位置", "地點", "coordinates", "座標", "經緯度", "latitude", "longitude",
	}

	lowerText := strings.ToLower(text)
	for _, keyword := range movementKeywords {
		if strings.Contains(lowerText, strings.ToLower(keyword)) {
			return true
		}
	}
	return false
}

func (p *MovementCommandParser) parseDirectCoordinates(text string) *geo.Location {
	// First try to extract from Google Maps URLs
	if strings.Contains(text, "maps") && (strings.Contains(text, "google") || strings.Contains(text, "goo.gl")) {
		if coords := p.parseGoogleMapsURL(text); coords != nil {
			return coords
		}
	}

	// Regex patterns for coordinates
	patterns := []string{
		`(\d+\.?\d*)\s*,\s*(\d+\.?\d*)`,           // 25.0330, 121.5654
		`緯度\s*[：:]\s*(\d+\.?\d*)\s*經度\s*[：:]\s*(\d+\.?\d*)`, // 緯度: 25.0330 經度: 121.5654
		`lat\s*[：:]\s*(\d+\.?\d*)\s*lng\s*[：:]\s*(\d+\.?\d*)`,   // lat: 25.0330 lng: 121.5654
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindStringSubmatch(text)
		if len(matches) >= 3 {
			lat, err1 := strconv.ParseFloat(matches[1], 64)
			lng, err2 := strconv.ParseFloat(matches[2], 64)
			if err1 == nil && err2 == nil {
				return &geo.Location{
					Latitude:  lat,
					Longitude: lng,
				}
			}
		}
	}
	return nil
}

func (p *MovementCommandParser) parseGoogleMapsURL(text string) *geo.Location {
	// Parse Google Maps URLs like: https://www.google.com/maps/@23.0162277,120.2353557,15z
	patterns := []string{
		`@(-?\d+\.?\d*),(-?\d+\.?\d*),\d+z`,                    // @lat,lng,zoom
		`@(-?\d+\.?\d*),(-?\d+\.?\d*)`,                         // @lat,lng
		`ll=(-?\d+\.?\d*),(-?\d+\.?\d*)`,                       // ll=lat,lng
		`center=(-?\d+\.?\d*),(-?\d+\.?\d*)`,                   // center=lat,lng
		`q=(-?\d+\.?\d*),(-?\d+\.?\d*)`,                        // q=lat,lng
		`place/[^/]*/@(-?\d+\.?\d*),(-?\d+\.?\d*)`,             // place/name/@lat,lng
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindStringSubmatch(text)
		if len(matches) >= 3 {
			lat, err1 := strconv.ParseFloat(matches[1], 64)
			lng, err2 := strconv.ParseFloat(matches[2], 64)
			if err1 == nil && err2 == nil {
				// Validate coordinates are within reasonable bounds
				if lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 {
					return &geo.Location{
						Latitude:  lat,
						Longitude: lng,
					}
				}
			}
		}
	}

	// Check if it's a Google Maps place URL like: https://www.google.com/maps/place/{location_name}
	placeName := p.extractPlaceNameFromURL(text)
	if placeName != "" {
		// Return a special marker indicating this is a place name that needs AI resolution
		// This will be handled by the calling function
		return &geo.Location{
			Latitude:  999.0, // Special marker for place name
			Longitude: 999.0,
		}
	}

	return nil
}

func (p *MovementCommandParser) parseDirectionDistance(text string) (string, float64) {
	directions := map[string]string{
		"北": "north", "南": "south", "東": "east", "西": "west",
		"東北": "northeast", "西北": "northwest", "東南": "southeast", "西南": "southwest",
		"north": "north", "south": "south", "east": "east", "west": "west",
		"northeast": "northeast", "northwest": "northwest",
		"southeast": "southeast", "southwest": "southwest",
		"前": "forward", "後": "backward", "左": "left", "右": "right",
		"forward": "forward", "backward": "backward", "left": "left", "right": "right",
	}

	// Extract direction
	var direction string
	lowerText := strings.ToLower(text)
	for keyword, dir := range directions {
		if strings.Contains(lowerText, keyword) {
			direction = dir
			break
		}
	}

	if direction == "" {
		return "", 0
	}

	// Extract distance
	distancePatterns := []string{
		`(\d+\.?\d*)\s*公尺`,
		`(\d+\.?\d*)\s*米`,
		`(\d+\.?\d*)\s*公里`,
		`(\d+\.?\d*)\s*meter`,
		`(\d+\.?\d*)\s*km`,
		`(\d+\.?\d*)\s*步`,
	}

	distance := 100.0 // default distance in meters
	for _, pattern := range distancePatterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindStringSubmatch(lowerText)
		if len(matches) >= 2 {
			if dist, err := strconv.ParseFloat(matches[1], 64); err == nil {
				if strings.Contains(pattern, "公里") || strings.Contains(pattern, "km") {
					distance = dist * 1000 // convert km to meters
				} else if strings.Contains(pattern, "步") {
					distance = dist * 0.75 // assume 0.75m per step
				} else {
					distance = dist
				}
				break
			}
		}
	}

	return direction, distance
}

func (p *MovementCommandParser) parseRelativeMovement(text string) *geo.Location {
	// Simple relative movements like "move a bit north", "go slightly east"
	// This would calculate relative coordinates based on current position
	// For now, return nil - this can be implemented based on specific needs
	return nil
}

func (p *MovementCommandParser) containsLocationName(text string) bool {
	locationIndicators := []string{
		// 主要城市
		"台北", "高雄", "台中", "台南", "桃園", "新竹", "基隆", "嘉義", "彰化", "南投", "雲林", "屏東", "宜蘭", "花蓮", "台東", "澎湖", "金門", "馬祖",

		// 著名景點
		"中正紀念堂", "台北101", "故宮", "夜市", "火車站", "機場", "總統府", "自由廣場", "龍山寺", "西門町", "九份", "淡水", "北投", "陽明山",
		"日月潭", "阿里山", "太魯閣", "墾丁", "清境", "合歡山", "玉山", "溪頭", "杉林溪", "集集", "鹿港", "安平", "赤崁樓", "愛河", "旗津",
		"佛光山", "義大世界", "六合夜市", "逢甲夜市", "一中商圈", "東海大學", "中興大學", "成功大學", "中山大學", "高雄大學",

		// 地標建築
		"公園", "學校", "醫院", "銀行", "便利商店", "餐廳", "百貨公司", "購物中心", "圖書館", "體育館", "游泳池", "電影院", "咖啡廳",
		"郵局", "警察局", "消防隊", "市政府", "區公所", "教堂", "廟宇", "博物館", "美術館", "動物園", "植物園", "海洋館",

		// 交通設施
		"車站", "捷運站", "高鐵站", "機場", "港口", "碼頭", "停車場", "加油站", "客運站", "轉運站",

		// 自然景觀
		"海邊", "海灘", "沙灘", "山", "湖", "河", "溪", "瀑布", "溫泉", "森林", "國家公園", "風景區", "步道", "古道",

		// 商業區域
		"商圈", "老街", "市場", "傳統市場", "夜市", "商店街", "購物街", "美食街", "小吃街",

		// 英文地名
		"taipei", "kaohsiung", "taichung", "tainan", "taoyuan", "hsinchu", "keelung", "chiayi", "changhua", "nantou",
		"yunlin", "pingtung", "yilan", "hualien", "taitung", "penghu", "kinmen", "matsu",
		"sun moon lake", "alishan", "taroko", "kenting", "yangmingshan", "jiufen", "tamsui", "beitou",

		// 大學
		"大學", "學院", "科技大學", "技術學院", "師範大學", "醫學院", "university", "college",

		// 更多地點類型指示詞
		"附近", "旁邊", "對面", "前面", "後面", "左邊", "右邊", "裡面", "外面", "上面", "下面",
		"這裡", "那裡", "哪裡", "某處", "地方", "位置", "地點", "景點", "據點", "站點",
	}

	lowerText := strings.ToLower(text)
	for _, indicator := range locationIndicators {
		if strings.Contains(lowerText, strings.ToLower(indicator)) {
			return true
		}
	}

	// 額外檢查：如果包含「到」、「去」等移動關鍵詞，也可能是地點移動
	movementWithLocation := []string{
		"到", "去", "前往", "移動到", "帶我去", "導航到", "走到", "跑到", "飛到",
		"go to", "move to", "navigate to", "travel to", "head to",
	}

	for _, keyword := range movementWithLocation {
		if strings.Contains(lowerText, strings.ToLower(keyword)) {
			return true
		}
	}

	return false
}

func (p *MovementCommandParser) extractLocationFromCommand(text string) string {
	lowerText := strings.ToLower(text)

	// Location keywords priority list (cities and landmarks)
	locationKeywords := []string{
		// 主要城市（優先匹配，避免被後面的內容污染）
		"台北市", "新北市", "桃園市", "台中市", "台南市", "高雄市", "基隆市", "新竹市", "嘉義市", "彰化縣",
		"台北", "新北", "桃園", "台中", "台南", "高雄", "基隆", "新竹", "嘉義", "彰化",
		"南投", "雲林", "屏東", "宜蘭", "花蓮", "台東", "澎湖", "金門", "馬祖",

		// 著名景點
		"台北101", "中正紀念堂", "故宮", "總統府", "自由廣場", "龍山寺", "西門町", "九份", "淡水", "北投", "陽明山",
		"日月潭", "阿里山", "太魯閣", "墾丁", "清境", "合歡山", "玉山", "溪頭", "杉林溪", "集集", "鹿港", "安平", "赤崁樓", "愛河", "旗津",
		"佛光山", "義大世界", "六合夜市", "逢甲夜市", "一中商圈", "東海大學", "中興大學", "成功大學", "中山大學", "高雄大學",
	}

	// First, try to find known location keywords in the text
	// This prevents "去嘉義市吃火雞肉飯" from becoming "嘉義市吃火雞肉飯"
	for _, keyword := range locationKeywords {
		if strings.Contains(lowerText, strings.ToLower(keyword)) {
			return keyword
		}
	}

	// If no known location found, try regex patterns
	patterns := []struct {
		regex string
		group int // which capture group contains the location name
	}{
		{`移動.*?到\s*([^，。！？\s吃喝玩買]+)`, 1},    // 移動到{地點}，排除常見動作詞
		{`去\s*([^，。！？\s吃喝玩買]+)`, 1},         // 去{地點}，排除「吃」「喝」等
		{`前往\s*([^，。！？\s吃喝玩買]+)`, 1},       // 前往{地點}
		{`帶我去\s*([^，。！？\s吃喝玩買]+)`, 1},     // 帶我去{地點}
		{`導航到\s*([^，。！？\s吃喝玩買]+)`, 1},     // 導航到{地點}
		{`move.*?to\s+([^\s,\.!?]+)`, 1},   // move to {location}
		{`go\s+to\s+([^\s,\.!?]+)`, 1},     // go to {location}
		{`navigate\s+to\s+([^\s,\.!?]+)`, 1}, // navigate to {location}
		{`travel\s+to\s+([^\s,\.!?]+)`, 1}, // travel to {location}
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern.regex)
		matches := re.FindStringSubmatch(lowerText)
		if len(matches) > pattern.group {
			locationName := strings.TrimSpace(matches[pattern.group])
			if locationName != "" {
				return locationName
			}
		}
	}

	return ""
}

func (p *MovementCommandParser) resolveLocationWithGeocoding(locationName string) (*geo.Location, error) {
	if p.geocodingService == nil {
		return nil, fmt.Errorf("geocoding service not available")
	}

	// Use Nominatim (OpenStreetMap) to resolve location
	location, err := p.geocodingService.GeocodeLocation(locationName)
	if err != nil {
		return nil, fmt.Errorf("geocoding failed: %v", err)
	}

	return location, nil
}

func (p *MovementCommandParser) validateAndEnrichCommand(command *MovementCommand, currentLocation *geo.Location) (*MovementCommand, error) {
	// Calculate destination for direction-based movements
	if command.Action == "direction_move" {
		dest := p.calculateDirectionDestination(currentLocation, command.Direction, command.Distance)
		command.Destination = dest
	}

	// Safety validation
	if command.Destination == nil {
		return nil, fmt.Errorf("no valid destination")
	}

	// Check Taiwan boundaries
	if !p.isWithinTaiwanBounds(command.Destination) {
		return nil, fmt.Errorf("destination outside Taiwan boundaries")
	}

	// Calculate distance and time
	if currentLocation != nil {
		distance := p.calculateDistance(currentLocation, command.Destination)

		// Safety check: maximum single movement distance (Taiwan island width is about 400km)
		maxDistance := 500000.0 // 500km - covers all of Taiwan
		if distance > maxDistance {
			return nil, fmt.Errorf("movement distance too large: %.2f meters (max: %.0f meters)", distance, maxDistance)
		}

		// Estimate travel time based on speed
		speed := p.getSpeedInMPS(command.Speed)
		command.EstimatedTime = int(distance / speed)
		command.Parameters["distance"] = distance
	}

	command.SafetyChecked = true
	return command, nil
}

func (p *MovementCommandParser) calculateDirectionDestination(current *geo.Location, direction string, distance float64) *geo.Location {
	// Convert distance to degrees (rough approximation)
	latDelta := distance / 111000.0 // 1 degree latitude ≈ 111km
	lngDelta := distance / (111000.0 * math.Cos(current.Latitude*math.Pi/180.0))

	var newLat, newLng float64

	switch direction {
	case "north":
		newLat = current.Latitude + latDelta
		newLng = current.Longitude
	case "south":
		newLat = current.Latitude - latDelta
		newLng = current.Longitude
	case "east":
		newLat = current.Latitude
		newLng = current.Longitude + lngDelta
	case "west":
		newLat = current.Latitude
		newLng = current.Longitude - lngDelta
	case "northeast":
		newLat = current.Latitude + latDelta*0.707
		newLng = current.Longitude + lngDelta*0.707
	case "northwest":
		newLat = current.Latitude + latDelta*0.707
		newLng = current.Longitude - lngDelta*0.707
	case "southeast":
		newLat = current.Latitude - latDelta*0.707
		newLng = current.Longitude + lngDelta*0.707
	case "southwest":
		newLat = current.Latitude - latDelta*0.707
		newLng = current.Longitude - lngDelta*0.707
	default:
		return current
	}

	return &geo.Location{
		Latitude:  newLat,
		Longitude: newLng,
	}
}

func (p *MovementCommandParser) isWithinTaiwanBounds(location *geo.Location) bool {
	return location.Latitude >= p.bounds.South &&
		   location.Latitude <= p.bounds.North &&
		   location.Longitude >= p.bounds.West &&
		   location.Longitude <= p.bounds.East
}

func (p *MovementCommandParser) calculateDistance(from, to *geo.Location) float64 {
	// Haversine formula for distance calculation
	const earthRadius = 6371000 // Earth radius in meters

	lat1Rad := from.Latitude * math.Pi / 180.0
	lat2Rad := to.Latitude * math.Pi / 180.0
	deltaLatRad := (to.Latitude - from.Latitude) * math.Pi / 180.0
	deltaLngRad := (to.Longitude - from.Longitude) * math.Pi / 180.0

	a := math.Sin(deltaLatRad/2)*math.Sin(deltaLatRad/2) +
		 math.Cos(lat1Rad)*math.Cos(lat2Rad)*
		 math.Sin(deltaLngRad/2)*math.Sin(deltaLngRad/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadius * c
}

func (p *MovementCommandParser) getSpeedInMPS(speedStr string) float64 {
	// Returns speed in meters per second
	switch speedStr {
	case "slow":
		return 1.0   // 1 m/s (walking slowly)
	case "fast":
		return 5.0   // 5 m/s (running)
	default: // "normal"
		return 2.5   // 2.5 m/s (normal walking)
	}
}

// Audit logging structure for movement commands
type MovementAudit struct {
	PlayerID       string            `json:"playerId"`
	Command        *MovementCommand  `json:"command"`
	OriginalInput  string            `json:"originalInput"`
	ParsedAt       time.Time         `json:"parsedAt"`
	ExecutedAt     *time.Time        `json:"executedAt"`
	Success        bool              `json:"success"`
	ErrorMessage   string            `json:"errorMessage,omitempty"`
	SessionID      string            `json:"sessionId"`
	IPAddress      string            `json:"ipAddress"`
}

func (p *MovementCommandParser) LogMovementCommand(playerID, sessionID, ipAddress string, command *MovementCommand, success bool, errorMsg string) *MovementAudit {
	now := time.Now()
	originalText := ""
	if command != nil {
		originalText = command.OriginalText
	}
	audit := &MovementAudit{
		PlayerID:      playerID,
		Command:       command,
		OriginalInput: originalText,
		ParsedAt:      now,
		Success:       success,
		ErrorMessage:  errorMsg,
		SessionID:     sessionID,
		IPAddress:     ipAddress,
	}

	if success {
		audit.ExecutedAt = &now
	}

	return audit
}

// extractPlaceNameFromURL extracts place name from Google Maps place URL
// Example: https://www.google.com/maps/place/台北101 -> "台北101"
func (p *MovementCommandParser) extractPlaceNameFromURL(text string) string {
	// Pattern for Google Maps place URLs
	patterns := []string{
		`https?://(?:www\.)?google\.com/maps/place/([^/?]+)`,          // place/name
		`https?://maps\.google\.com/maps/place/([^/?]+)`,              // maps.google.com version
		`https?://(?:www\.)?google\.com\.tw/maps/place/([^/?]+)`,       // Taiwan Google domain
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindStringSubmatch(text)
		if len(matches) >= 2 {
			// URL decode the place name
			placeName := matches[1]
			// Replace URL encoded characters
			placeName = strings.ReplaceAll(placeName, "%E5%8F%B0%E5%8C%97101", "台北101") // Example: URL encoded 台北101
			placeName = strings.ReplaceAll(placeName, "+", " ")
			placeName = strings.ReplaceAll(placeName, "%20", " ")

			// Simple URL decode for common Chinese characters (this could be enhanced)
			if decoded, err := url.QueryUnescape(placeName); err == nil {
				return decoded
			}
			return placeName
		}
	}

	return ""
}