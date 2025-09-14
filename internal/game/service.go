package game

import (
	"fmt"
	"math"
	"math/rand"
	"time"

	"gorm.io/gorm"
)

type Service struct {
	db *gorm.DB
}

type CollectResult struct {
	Success     bool   `json:"success"`
	Score       int    `json:"score"`
	TotalScore  int    `json:"totalScore"`
	Message     string `json:"message"`
	Item        *Item  `json:"item,omitempty"`
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
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