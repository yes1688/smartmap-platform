// Configuration for the Intelligent Spatial Platform
export const CONFIG = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
    endpoints: {
      locations: '/locations',
      historicalSites: '/historical-sites',
      voiceProcess: '/voice/process',
      aiChat: '/ai/chat',
      aiMovement: '/ai/movement',
      chatWithMovement: '/ai/chat-movement',
      movementStats: '/ai/movement-stats',
      gameStatus: '/game/status',
      gameCollect: '/game/collect',
      gameMove: '/game/move',
      searchPlace: '/ai/places/search'
    }
  },

  // WebSocket Configuration
  websocket: {
    url: import.meta.env.VITE_WS_URL || '/ws'
  },

  // Map Configuration (Deck.gl + MapLibre)
  map: {
    // Default view settings
    defaultView: {
      longitude: 121.5654,  // Taipei, Taiwan
      latitude: 25.0330,
      zoom: 15
    },

    // Map style settings
    style: {
      cartoDB: {
        tiles: [
          'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
          'https://cartodb-basemaps-b.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
          'https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '© CartoDB, © OpenStreetMap contributors'
      }
    }
  },

  // Game Configuration
  game: {
    collectionRadius: 50,  // meters
    itemSpawnInterval: 30000,  // 30 seconds
    maxItemsOnMap: 10,
    scoreValues: {
      common: 10,
      rare: 50,
      legendary: 100
    },
    itemColors: {
      common: '#4CAF50',     // Green
      rare: '#2196F3',       // Blue
      legendary: '#FF9800'   // Orange
    }
  },

  // Voice Configuration
  voice: {
    language: 'zh-TW',
    recognitionTimeout: 5000,  // 5 seconds
    supportedCommands: [
      'navigate', 'collect', 'introduce', 'status'
    ]
  },

  // AI Configuration
  ai: {
    maxMessageLength: 500,
    responseTimeout: 10000,  // 10 seconds
    contextWindow: 5  // Number of previous messages to include
  },

  // Map Styling
  mapStyles: {
    playerMarker: {
      image: '🧑‍🚀',
      scale: 1.5,
      color: '#FF6B6B'
    },
    historicalSite: {
      image: '🏛️',
      scale: 1.2,
      color: '#9C27B0'
    },
    itemMarker: {
      scale: 0.8,
      heightReference: 'CLAMP_TO_GROUND'
    }
  },

  // UI Configuration
  ui: {
    animationDuration: 300,  // ms
    notificationTimeout: 3000,  // ms
    panelTransition: 'all 0.3s ease-in-out'
  },

  // Default bounds for Taiwan
  defaultBounds: {
    north: 25.3,
    south: 24.7,
    east: 121.8,
    west: 121.3
  }
} as const;

export type Config = typeof CONFIG;