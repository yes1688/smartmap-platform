package game

import (
	"fmt"
	"math"
	"math/rand"
	"time"

	"gorm.io/gorm"
	"intelligent-spatial-platform/internal/ai"
	"intelligent-spatial-platform/internal/geo"
)

type Service struct {
	db               *gorm.DB
	aiService        *ai.Service
	geocodingService *geo.GeocodingService
	movementParser   *ai.MovementCommandParser
	rateLimiter      map[string]*RateLimit
}

type CollectResult struct {
	Success     bool   `json:"success"`
	Score       int    `json:"score"`
	TotalScore  int    `json:"totalScore"`
	Message     string `json:"message"`
	Item        *Item  `json:"item,omitempty"`
}

type RateLimit struct {
	Count     int       `json:"count"`
	LastReset time.Time `json:"lastReset"`
	WindowDuration time.Duration `json:"windowDuration"`
	MaxRequests    int           `json:"maxRequests"`
}

type AIMovementResult struct {
	Success          bool                   `json:"success"`
	Message          string                 `json:"message"`
	MovementCommand  *ai.MovementCommand    `json:"movementCommand,omitempty"`
	NewPosition      *geo.Location          `json:"newPosition,omitempty"`
	EstimatedTime    int                    `json:"estimatedTime"`
	ErrorCode        string                 `json:"errorCode,omitempty"`
	RateLimited      bool                   `json:"rateLimited,omitempty"`
	Audit            *ai.MovementAudit      `json:"audit,omitempty"`
}

func NewService(db *gorm.DB, aiService *ai.Service) *Service {
	// Initialize geocoding service
	geocodingService, err := geo.NewGeocodingService()
	if err != nil {
		// Log error but don't fail service initialization
		fmt.Printf("Warning: Failed to initialize geocoding service in game service: %v\n", err)
	}

	service := &Service{
		db:               db,
		aiService:        aiService,
		geocodingService: geocodingService,
		rateLimiter:      make(map[string]*RateLimit),
	}

	// Initialize movement parser with geocoding service
	service.movementParser = ai.NewMovementCommandParser(aiService, geocodingService)

	return service
}

func (s *Service) CreatePlayer(id, name string, lat, lng float64) (*Player, error) {
	player := &Player{
		ID:        id,
		Name:      name,
		Latitude:  lat,
		Longitude: lng,
		Score:     0,
		Level:     1,
		IsActive:  true,
	}

	if err := s.db.Create(player).Error; err != nil {
		return nil, err
	}

	return player, nil
}

func (s *Service) GetPlayerStatus(playerID string) (*Player, error) {
	var player Player
	if err := s.db.First(&player, "id = ?", playerID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Auto-create player if not found
			newPlayer, createErr := s.CreatePlayer(playerID, "Player "+playerID, 25.0330, 121.5654) // Taipei coordinates
			if createErr != nil {
				return nil, createErr
			}
			return newPlayer, nil
		}
		return nil, err
	}

	return &player, nil
}

func (s *Service) GetAllPlayers() ([]Player, error) {
	var players []Player
	if err := s.db.Find(&players).Error; err != nil {
		return nil, err
	}
	return players, nil
}

func (s *Service) GetAllSessions() ([]GameSession, error) {
	var sessions []GameSession
	if err := s.db.Find(&sessions).Error; err != nil {
		return nil, err
	}
	return sessions, nil
}

func (s *Service) MovePlayer(playerID string, lat, lng float64) error {
	result := s.db.Model(&Player{}).Where("id = ?", playerID).Updates(Player{
		Latitude:  lat,
		Longitude: lng,
		UpdatedAt: time.Now(),
	})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("player not found")
	}

	return nil
}

func (s *Service) CollectItem(playerID, itemID string, playerLat, playerLng float64) (*CollectResult, error) {
	var item Item
	if err := s.db.First(&item, "id = ? AND is_collected = false", itemID).Error; err != nil {
		return &CollectResult{
			Success: false,
			Message: "Item not found or already collected",
		}, nil
	}

	distance := calculateDistance(playerLat, playerLng, item.Latitude, item.Longitude)
	if distance > 50.0 { // 50 meters collection radius
		return &CollectResult{
			Success: false,
			Message: "You are too far from the item",
		}, nil
	}

	now := time.Now()
	item.IsCollected = true
	item.CollectedBy = playerID
	item.CollectedAt = &now

	if err := s.db.Save(&item).Error; err != nil {
		return nil, err
	}

	var player Player
	if err := s.db.First(&player, "id = ?", playerID).Error; err != nil {
		return nil, err
	}

	player.Score += item.Value
	if err := s.db.Save(&player).Error; err != nil {
		return nil, err
	}

	return &CollectResult{
		Success:    true,
		Score:      item.Value,
		TotalScore: player.Score,
		Message:    fmt.Sprintf("Collected %s! +%d points", item.Name, item.Value),
		Item:       &item,
	}, nil
}

func (s *Service) SpawnRandomItems(count int, bounds map[string]float64) error {
	items := generateRandomItems(count, bounds)

	for _, item := range items {
		if err := s.db.Create(&item).Error; err != nil {
			return err
		}
	}

	return nil
}

func (s *Service) GetActiveItems(bounds map[string]float64) ([]Item, error) {
	var items []Item
	err := s.db.Where("is_collected = false AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?",
		bounds["south"], bounds["north"], bounds["west"], bounds["east"]).Find(&items).Error

	return items, err
}

func (s *Service) StartGameSession(playerID string) (*GameSession, error) {
	session := &GameSession{
		ID:        generateID(),
		PlayerID:  playerID,
		StartTime: time.Now(),
		Score:     0,
	}

	if err := s.db.Create(session).Error; err != nil {
		return nil, err
	}

	return session, nil
}

func (s *Service) EndGameSession(sessionID string) error {
	now := time.Now()
	return s.db.Model(&GameSession{}).Where("id = ?", sessionID).Updates(GameSession{
		EndTime:   &now,
		UpdatedAt: time.Now(),
	}).Error
}

func generateRandomItems(count int, bounds map[string]float64) []Item {
	itemTypes := []string{"treasure", "artifact", "bonus"}
	rarities := []string{"common", "rare", "legendary"}
	itemNames := []string{
		"古代銅錢", "陶瓷碎片", "石製工具", "竹簡殘片", "青銅器具",
		"古老地圖", "神秘寶石", "歷史文獻", "古代印章", "傳說寶物",
	}

	items := make([]Item, count)
	for i := 0; i < count; i++ {
		rarity := rarities[rand.Intn(len(rarities))]
		value := getValueByRarity(rarity)

		items[i] = Item{
			ID:          generateID(),
			Name:        itemNames[rand.Intn(len(itemNames))],
			Description: "A mysterious historical artifact waiting to be discovered",
			ItemType:    itemTypes[rand.Intn(len(itemTypes))],
			Value:       value,
			Rarity:      rarity,
			Latitude:    bounds["south"] + rand.Float64()*(bounds["north"]-bounds["south"]),
			Longitude:   bounds["west"] + rand.Float64()*(bounds["east"]-bounds["west"]),
			SpawnedAt:   time.Now(),
		}
	}

	return items
}

func getValueByRarity(rarity string) int {
	switch rarity {
	case "common":
		return 10 + rand.Intn(20)
	case "rare":
		return 50 + rand.Intn(50)
	case "legendary":
		return 100 + rand.Intn(100)
	default:
		return 10
	}
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

func generateID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

// AI-controlled secure movement system
func (s *Service) ProcessAIMovementCommand(playerID, command, sessionID, ipAddress string) (*AIMovementResult, error) {
	// Check rate limiting first
	if s.isRateLimited(playerID) {
		return &AIMovementResult{
			Success:     false,
			Message:     "移動指令頻率過高，請稍後再試",
			ErrorCode:   "RATE_LIMITED",
			RateLimited: true,
		}, nil
	}

	// Get current player position
	player, err := s.GetPlayerStatus(playerID)
	if err != nil {
		return &AIMovementResult{
			Success:   false,
			Message:   "無法取得玩家狀態",
			ErrorCode: "PLAYER_NOT_FOUND",
		}, err
	}

	currentLocation := &geo.Location{
		Latitude:  player.Latitude,
		Longitude: player.Longitude,
	}

	// Parse movement command using AI
	moveCmd, err := s.movementParser.ParseMovementCommand(command, currentLocation)
	if err != nil {
		// Log the failed attempt
		audit := s.movementParser.LogMovementCommand(playerID, sessionID, ipAddress, nil, false, err.Error())

		return &AIMovementResult{
			Success:   false,
			Message:   "無法解析移動指令：" + err.Error(),
			ErrorCode: "PARSE_ERROR",
			Audit:     audit,
		}, nil
	}

	// Additional security validation
	if err := s.validateMovementSecurity(moveCmd, currentLocation); err != nil {
		audit := s.movementParser.LogMovementCommand(playerID, sessionID, ipAddress, moveCmd, false, err.Error())

		return &AIMovementResult{
			Success:         false,
			Message:         "移動指令安全驗證失敗：" + err.Error(),
			ErrorCode:       "SECURITY_VIOLATION",
			MovementCommand: moveCmd,
			Audit:           audit,
		}, nil
	}

	// Execute the movement
	err = s.MovePlayer(playerID, moveCmd.Destination.Latitude, moveCmd.Destination.Longitude)
	if err != nil {
		audit := s.movementParser.LogMovementCommand(playerID, sessionID, ipAddress, moveCmd, false, err.Error())

		return &AIMovementResult{
			Success:         false,
			Message:         "移動執行失敗：" + err.Error(),
			ErrorCode:       "EXECUTION_ERROR",
			MovementCommand: moveCmd,
			Audit:           audit,
		}, nil
	}

	// Update rate limiter
	s.updateRateLimit(playerID)

	// Log successful movement
	audit := s.movementParser.LogMovementCommand(playerID, sessionID, ipAddress, moveCmd, true, "")

	// Generate AI response
	aiResponse, _ := s.aiService.ProcessMovementCommand(command, playerID, currentLocation)

	return &AIMovementResult{
		Success:         true,
		Message:         aiResponse,
		MovementCommand: moveCmd,
		NewPosition:     moveCmd.Destination,
		EstimatedTime:   moveCmd.EstimatedTime,
		Audit:           audit,
	}, nil
}

func (s *Service) isRateLimited(playerID string) bool {
	limit, exists := s.rateLimiter[playerID]
	if !exists {
		s.rateLimiter[playerID] = &RateLimit{
			Count:          0,
			LastReset:      time.Now(),
			WindowDuration: 1 * time.Minute, // 1-minute window
			MaxRequests:    10,               // max 10 movement commands per minute
		}
		return false
	}

	// Reset if window expired
	if time.Since(limit.LastReset) > limit.WindowDuration {
		limit.Count = 0
		limit.LastReset = time.Now()
	}

	return limit.Count >= limit.MaxRequests
}

func (s *Service) updateRateLimit(playerID string) {
	if limit, exists := s.rateLimiter[playerID]; exists {
		limit.Count++
	}
}

func (s *Service) validateMovementSecurity(moveCmd *ai.MovementCommand, currentLocation *geo.Location) error {
	// Check if basic safety checks already passed
	if !moveCmd.SafetyChecked {
		return fmt.Errorf("movement command failed basic safety checks")
	}

	// Additional business logic validations
	distance := calculateDistance(currentLocation.Latitude, currentLocation.Longitude,
		moveCmd.Destination.Latitude, moveCmd.Destination.Longitude)

	// Prevent teleportation-like movements (allow Taiwan-wide travel)
	if distance > 500000 { // 500km max single movement (covers all of Taiwan)
		return fmt.Errorf("movement distance too large: %.2f meters (max: 500000 meters)", distance)
	}

	// Check confidence level
	if moveCmd.Confidence < 0.3 {
		return fmt.Errorf("movement command confidence too low: %.1f%% (min: 30%%)", moveCmd.Confidence*100)
	}

	// Validate against historical site boundaries (prevent moving into restricted areas)
	if s.isInRestrictedArea(moveCmd.Destination) {
		return fmt.Errorf("destination is in a restricted area")
	}

	return nil
}

func (s *Service) isInRestrictedArea(location *geo.Location) bool {
	// This could check against a database of restricted areas
	// For now, just return false (no restrictions)
	return false
}

// Get movement statistics for monitoring
func (s *Service) GetMovementStats(playerID string) map[string]interface{} {
	stats := map[string]interface{}{
		"playerID": playerID,
	}

	if limit, exists := s.rateLimiter[playerID]; exists {
		stats["rateLimitCount"] = limit.Count
		stats["rateLimitWindow"] = limit.WindowDuration.String()
		stats["rateLimitMax"] = limit.MaxRequests
		stats["lastActivity"] = limit.LastReset
	}

	return stats
}