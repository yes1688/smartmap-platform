package game

import (
	"testing"
	"time"
)

// TestPlayerModel tests player model creation
func TestPlayerModel(t *testing.T) {
	player := &Player{
		ID:    "player1",
		Name:  "Test Player",
		Score: 100,
		Level: 2,
	}

	if player.ID != "player1" {
		t.Errorf("Expected ID 'player1', got %s", player.ID)
	}

	if player.Score != 100 {
		t.Error("Expected score 100")
	}

	if player.Level != 2 {
		t.Error("Expected level 2")
	}
}

// TestItemModel tests item model creation
func TestItemModel(t *testing.T) {
	item := &Item{
		ID:       "item1",
		Name:     "Treasure",
		ItemType: "treasure",
		Value:    50,
		Rarity:   "rare",
	}

	if item.Name != "Treasure" {
		t.Error("Incorrect item name")
	}

	if item.ItemType != "treasure" {
		t.Error("Incorrect item type")
	}

	if item.Value != 50 {
		t.Error("Incorrect value")
	}

	if item.Rarity != "rare" {
		t.Error("Incorrect rarity")
	}
}

// TestGameSessionModel tests session model
func TestGameSessionModel(t *testing.T) {
	now := time.Now()
	session := &GameSession{
		ID:             "session1",
		PlayerID:       "player1",
		StartTime:      now,
		Score:          200,
		ItemsCollected: 5,
	}

	if session.PlayerID != "player1" {
		t.Error("Expected PlayerID 'player1'")
	}

	if session.Score != 200 {
		t.Error("Expected score 200")
	}

	if session.ItemsCollected != 5 {
		t.Error("Expected 5 items collected")
	}
}

// TestPlayerStatsModel tests player stats model
func TestPlayerStatsModel(t *testing.T) {
	stats := &PlayerStats{
		PlayerID:      "player1",
		TotalScore:    1000,
		TotalSessions: 10,
		TotalItems:    25,
		BestScore:     250,
	}

	if stats.TotalScore != 1000 {
		t.Error("Incorrect total score")
	}

	if stats.TotalSessions != 10 {
		t.Error("Incorrect total sessions")
	}

	if stats.TotalItems != 25 {
		t.Error("Incorrect total items")
	}
}

// TestItemRarityLevels tests different item rarities
func TestItemRarityLevels(t *testing.T) {
	rarities := []string{"common", "rare", "legendary"}

	for _, rarity := range rarities {
		item := &Item{
			ID:     "test-item",
			Name:   "Test",
			Rarity: rarity,
		}

		if item.Rarity != rarity {
			t.Errorf("Expected rarity %s, got %s", rarity, item.Rarity)
		}
	}
}

// TestItemTypes tests different item types
func TestItemTypes(t *testing.T) {
	types := []string{"treasure", "artifact", "bonus"}

	for _, itemType := range types {
		item := &Item{
			ID:       "test-item",
			Name:     "Test",
			ItemType: itemType,
		}

		if item.ItemType != itemType {
			t.Errorf("Expected type %s, got %s", itemType, item.ItemType)
		}
	}
}

// BenchmarkPlayerCreation benchmarks player model creation
func BenchmarkPlayerCreation(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_ = &Player{
			ID:    "player1",
			Name:  "Test",
			Score: 100,
			Level: 1,
		}
	}
}

// BenchmarkItemCreation benchmarks item model creation
func BenchmarkItemCreation(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_ = &Item{
			ID:       "item1",
			Name:     "Treasure",
			ItemType: "treasure",
			Value:    50,
		}
	}
}