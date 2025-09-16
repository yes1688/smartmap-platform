import { createSignal, createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { GameState, Player, PlayerStats, GameItem, CollectResult } from '@/types';
import { CONFIG } from '@/config';

// Game state store
const [gameState, setGameState] = createStore<GameState>({
  player: {
    id: 'default-player',
    name: 'Default Player',
    latitude: CONFIG.map.defaultView.latitude,
    longitude: CONFIG.map.defaultView.longitude,
    level: 1,
    score: 0,
    items: 0,
  },
  playerStats: {
    playerId: '',
    totalScore: 0,
    totalSessions: 0,
    totalItems: 0,
    averageScore: 0,
    bestScore: 0,
    totalPlayTime: 0,
    lastPlayed: undefined,
  },
  nearbyItems: [],
  gameSession: undefined,
  isGameActive: false,
});

// Signals for reactive values
const [isLoading, setIsLoading] = createSignal(false);
const [lastActivity, setLastActivity] = createSignal<string>('');

// Game actions
export const gameActions = {
  // Initialize game for a player
  async initializeGame(playerId: string) {
    setIsLoading(true);
    try {
      await loadPlayerStats(playerId);
      await startGameSession(playerId);
      setGameState('isGameActive', true);
    } catch (error) {
      console.error('Failed to initialize game:', error);
    } finally {
      setIsLoading(false);
    }
  },

  // Update player position
  async updatePlayerPosition(latitude: number, longitude: number) {
    if (!gameState.player) return;

    try {
      const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.endpoints.gameMove}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: gameState.player.id,
          lat: latitude,
          lng: longitude,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update player position
        setGameState('player', 'latitude', latitude);
        setGameState('player', 'longitude', longitude);

        // Handle historical site encounter
        if (data.historicalSite) {
          handleHistoricalSiteEncounter(data.historicalSite, data.aiIntroduction);
        }

        // Update nearby items
        updateNearbyItems();
      }
    } catch (error) {
      console.error('Failed to update player position:', error);
    }
  },

  // Collect an item
  async collectItem(itemId: string, playerLat: number, playerLng: number): Promise<CollectResult | null> {
    if (!gameState.player) return null;

    try {
      const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.endpoints.gameCollect}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: gameState.player.id,
          itemId,
          lat: playerLat,
          lng: playerLng,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.data as CollectResult;

        if (result.success) {
          // Update player stats
          setGameState('playerStats', 'totalScore', result.totalScore);
          setGameState('playerStats', 'totalItems', prev => prev + 1);

          // Check for level up
          const newLevel = calculateLevel(result.totalScore);
          if (newLevel > gameState.player.level) {
            setGameState('player', 'level', newLevel);
            addActivity(`升級到第 ${newLevel} 級！`);
          }

          // Remove item from nearby items
          setGameState('nearbyItems', prev => prev.filter(item => item.id !== itemId));

          // Add activity
          if (result.item) {
            addActivity(`收集到 ${result.item.name}！+${result.score} 分`);
          }

          return result;
        }
      }
    } catch (error) {
      console.error('Failed to collect item:', error);
    }

    return null;
  },

  // Award points for various achievements
  awardPoints(points: number, reason: string) {
    const currentScore = gameState.playerStats.totalScore + points;
    setGameState('playerStats', 'totalScore', currentScore);

    if (gameState.player) {
      const newLevel = calculateLevel(currentScore);
      if (newLevel > gameState.player.level) {
        setGameState('player', 'level', newLevel);
        addActivity(`升級到第 ${newLevel} 級！`);
      }
    }

    addActivity(`${reason} +${points} 分`);
  },

  // Update nearby items
  updateNearbyItems() {
    updateNearbyItems();
  },

  // Get player stats
  getPlayerStats() {
    return gameState.playerStats;
  },

  // End current game session
  async endGameSession() {
    if (!gameState.gameSession) return;

    try {
      const response = await fetch(`${CONFIG.api.baseUrl}/game/sessions/${gameState.gameSession.id}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: gameState.playerStats.totalScore,
          duration: Math.floor((Date.now() - new Date(gameState.gameSession.startTime).getTime()) / 1000),
        }),
      });

      if (response.ok) {
        setGameState('gameSession', undefined);
        setGameState('isGameActive', false);
      }
    } catch (error) {
      console.error('Failed to end game session:', error);
    }
  },

  // Set player position directly (for AI movement responses)
  setPlayerPosition(latitude: number, longitude: number) {
    if (!gameState.player) return;

    // Update player position in the store
    setGameState('player', 'latitude', latitude);
    setGameState('player', 'longitude', longitude);

    console.log(`🎮 Updated player position: ${latitude}, ${longitude}`);
  },
};

// Helper functions
async function loadPlayerStats(playerId: string) {
  try {
    const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.endpoints.gameStatus}?playerId=${playerId}`);

    if (response.ok) {
      const data = await response.json();
      if (data.data) {
        const player = data.data as Player;
        setGameState('player', player);
        setGameState('playerStats', {
          playerId,
          totalScore: player.score,
          totalSessions: 0,
          totalItems: 0,
          averageScore: player.score,
          bestScore: player.score,
          totalPlayTime: 0,
        });
      }
    } else {
      // Create new player
      await createNewPlayer(playerId);
    }
  } catch (error) {
    console.error('Failed to load player stats:', error);
    // 後端不可用時創建默認玩家
    createDefaultPlayer(playerId);
  }
}

async function createNewPlayer(playerId: string) {
  try {
    const response = await fetch(`${CONFIG.api.baseUrl}/game/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: playerId,
        name: `Player_${playerId.substring(0, 8)}`,
        latitude: CONFIG.map.defaultView.latitude,
        longitude: CONFIG.map.defaultView.longitude,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const player = data.data as Player;
      setGameState('player', player);
    }
  } catch (error) {
    console.error('Failed to create new player:', error);
    createDefaultPlayer(playerId);
  }
}

function createDefaultPlayer(playerId: string) {
  const defaultPlayer = {
    id: playerId,
    name: `Player_${playerId.substring(0, 8)}`,
    latitude: CONFIG.map.defaultView.latitude,
    longitude: CONFIG.map.defaultView.longitude,
    level: 1,
    score: 0,
    items: 0,
  };

  setGameState('player', defaultPlayer);
  setGameState('playerStats', {
    playerId,
    totalScore: 0,
    totalSessions: 1,
    totalItems: 0,
    averageScore: 0,
    bestScore: 0,
    totalPlayTime: 0,
    lastPlayed: new Date(),
  });
}

async function startGameSession(playerId: string) {
  try {
    const response = await fetch(`${CONFIG.api.baseUrl}/game/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    });

    if (response.ok) {
      const data = await response.json();
      setGameState('gameSession', data.data);
    }
  } catch (error) {
    console.error('Failed to start game session:', error);
  }
}

function calculateLevel(score: number): number {
  return Math.floor(score / 100) + 1;
}

function handleHistoricalSiteEncounter(site: any, aiIntroduction?: string) {
  console.log('🏛️ Historical site encountered:', site.name);

  // Award points for discovering historical sites
  gameActions.awardPoints(25, '發現歷史景點');

  addActivity(`發現歷史景點：${site.name}`);
}

function updateNearbyItems() {
  // This would be implemented to fetch nearby items from the API
  // For now, it's a placeholder
}

function addActivity(message: string) {
  const timestamp = new Date().toLocaleTimeString();
  setLastActivity(`${timestamp} - ${message}`);
}

// Computed values
export const gameComputed = {
  get currentPlayer() {
    return gameState.player;
  },
  get playerStats() {
    return gameState.playerStats;
  },
  get nearbyItems() {
    return gameState.nearbyItems;
  },
  get isGameActive() {
    return gameState.isGameActive;
  },
  get isLoading() {
    return isLoading();
  },
  get lastActivity() {
    return lastActivity();
  },
};

// Combined store export for easier access
export const gameStore = {
  ...gameActions,
  ...gameComputed,
  player: gameComputed.currentPlayer,
};

