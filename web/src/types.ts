// Type definitions for the Intelligent Spatial Platform

export interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  type?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoricalSite {
  id: number;
  name: string;
  description: string;
  era: string;
  latitude: number;
  longitude: number;
  address?: string;
  images?: string[];
  audioGuide?: string;
  isActive: boolean;
  visitCount: number;
  createdAt: string;
  updatedAt: string;
  aiIntroduction?: string;
}

export interface GameItem {
  id: string;
  name: string;
  description: string;
  itemType: 'treasure' | 'artifact' | 'bonus';
  value: number;
  rarity: 'common' | 'rare' | 'legendary';
  latitude: number;
  longitude: number;
  isCollected: boolean;
  collectedBy?: string;
  spawnedAt: string;
  collectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  score: number;
  level: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerStats {
  playerId: string;
  totalScore: number;
  totalSessions: number;
  totalItems: number;
  averageScore: number;
  bestScore: number;
  totalPlayTime: number; // in seconds
  lastPlayed?: string;
}

export interface GameSession {
  id: string;
  playerId: string;
  startTime: string;
  endTime?: string;
  score: number;
  duration: number; // in seconds
  itemsCollected: number;
  createdAt: string;
  updatedAt: string;
  player?: Player;
}

export interface CollectResult {
  success: boolean;
  score: number;
  totalScore: number;
  message: string;
  item?: GameItem;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  data: any;
  userId?: string;
  timestamp: number;
}

export interface PlayerMoveData {
  userId: string;
  latitude: number;
  longitude: number;
}

export interface ItemCollectedData {
  userId: string;
  itemId: string;
  score: number;
  item?: GameItem;
}

export interface VoiceCommandData {
  userId: string;
  command: string;
  result?: any;
}

export interface ChatMessageData {
  userId: string;
  message: string;
  sender: 'user' | 'ai';
}

// Voice command types
export interface VoiceCommand {
  type: 'navigation' | 'game' | 'query' | 'chat' | 'status';
  action: string;
  parameters: Record<string, any>;
  text: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Chat message types
export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  message: string;
  timestamp: number;
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
}

// Position and geographic types
export interface Position {
  latitude: number;
  longitude: number;
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeoFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: number[] | number[][] | number[][][];
  };
}

// UI State types
export interface UIState {
  isVoicePanelOpen: boolean;
  isChatPanelOpen: boolean;
  isGamePanelExpanded: boolean;
  isSiteInfoPanelOpen: boolean;
  isLoading: boolean;
  currentHistoricalSite?: HistoricalSite;
}

// Game state types
export interface GameState {
  player?: Player;
  playerStats: PlayerStats;
  nearbyItems: GameItem[];
  gameSession?: GameSession;
  isGameActive: boolean;
}

// Voice state types
export interface VoiceState {
  isRecording: boolean;
  isSupported: boolean;
  status: string;
  lastCommand?: VoiceCommand;
}

// AI Chat state types
export interface AIChatState {
  messages: ChatMessage[];
  isProcessing: boolean;
  conversationHistory: ChatMessage[];
}

// WebSocket state types
export interface WebSocketState {
  isConnected: boolean;
  reconnectAttempts: number;
  lastMessage?: WebSocketMessage;
}