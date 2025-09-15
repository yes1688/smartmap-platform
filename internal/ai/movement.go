package ai

import (
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
	"time"

	"intelligent-spatial-platform/internal/geo"
)

type MovementCommandParser struct {
	aiService *Service
	bounds    *geo.Bounds
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

// Taiwan boundary for safety checks
var taiwanBounds = &geo.Bounds{
	North: 25.3,
	South: 22.0,
	East:  122.0,
	West:  120.0,
}

func NewMovementCommandParser(aiService *Service) *MovementCommandParser {
	return &MovementCommandParser{
		aiService: aiService,
		bounds:    taiwanBounds,
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
		command.Type = "move"
		command.Action = "absolute_move"
		command.Destination = coords
		command.Confidence = 0.9
		return p.validateAndEnrichCommand(command, currentLocation)
	}

	// Parse direction and distance (high confidence)
	if direction, distance := p.parseDirectionDistance(text); direction != "" {
		command.Type = "move"
		command.Action = "direction_move"
		command.Direction = direction
		command.Distance = distance
		command.Confidence = 0.8
		return p.validateAndEnrichCommand(command, currentLocation)
	}

	// Parse relative movements
	if relativeMove := p.parseRelativeMovement(text); relativeMove != nil {
		command.Type = "move"
		command.Action = "relative_move"
		command.Destination = relativeMove
		command.Confidence = 0.7
		return p.validateAndEnrichCommand(command, currentLocation)
	}

	// Parse named locations using AI
	if p.containsLocationName(text) {
		command.RequiresAI = true
		aiLocation, err := p.resolveLocationWithAI(text, currentLocation)
		if err != nil {
			return nil, fmt.Errorf("failed to resolve location with AI: %v", err)
		}

		command.Type = "go_to"
		command.Action = "absolute_move"
		command.Destination = aiLocation
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
		"台北", "高雄", "台中", "台南", "桃園", "新竹", "基隆",
		"中正紀念堂", "台北101", "故宮", "夜市", "火車站", "機場",
		"公園", "學校", "醫院", "銀行", "便利商店", "餐廳",
		"taipei", "kaohsiung", "taichung", "tainan",
	}

	lowerText := strings.ToLower(text)
	for _, indicator := range locationIndicators {
		if strings.Contains(lowerText, strings.ToLower(indicator)) {
			return true
		}
	}
	return false
}

func (p *MovementCommandParser) resolveLocationWithAI(text string, currentLocation *geo.Location) (*geo.Location, error) {
	prompt := fmt.Sprintf(`使用者想要移動到："%s"
目前位置：緯度 %.6f，經度 %.6f

請分析這個地點並回傳台灣境內最可能的座標。回傳格式必須是：
COORDINATES: 緯度,經度
例如：COORDINATES: 25.0330,121.5654

如果無法識別地點，請回傳：UNKNOWN_LOCATION`,
		text, currentLocation.Latitude, currentLocation.Longitude)

	response, err := p.aiService.Chat(prompt, "你是地理位置解析專家，專門將地點名稱轉換為台灣境內的精確座標。")
	if err != nil {
		return nil, err
	}

	// Parse AI response
	re := regexp.MustCompile(`COORDINATES:\s*(\d+\.?\d*)\s*,\s*(\d+\.?\d*)`)
	matches := re.FindStringSubmatch(response)
	if len(matches) >= 3 {
		lat, err1 := strconv.ParseFloat(matches[1], 64)
		lng, err2 := strconv.ParseFloat(matches[2], 64)
		if err1 == nil && err2 == nil {
			return &geo.Location{
				Latitude:  lat,
				Longitude: lng,
			}, nil
		}
	}

	return nil, fmt.Errorf("AI unable to resolve location")
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

		// Safety check: maximum single movement distance
		maxDistance := 50000.0 // 50km
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
	audit := &MovementAudit{
		PlayerID:      playerID,
		Command:       command,
		OriginalInput: command.OriginalText,
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