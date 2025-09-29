import { gameStore } from '@/stores/gameStore';

export interface UserIntent {
  type: 'movement' | 'exploration' | 'information' | 'entertainment';
  confidence: number;
  suggestedActions: SuggestedAction[];
}

export interface SuggestedAction {
  id: string;
  type: 'quick_move' | 'explore_category' | 'time_based' | 'contextual';
  title: string;
  description: string;
  emoji: string;
  action: () => void;
  priority: number;
  relevanceScore: number;
}

export interface UserBehaviorPattern {
  timeOfDay: number;
  dayOfWeek: number;
  frequentLocations: string[];
  preferredCategories: string[];
  sessionDuration: number;
  interactionFrequency: number;
}

export class PredictionEngine {
  private behaviorHistory: UserBehaviorPattern[] = [];
  private currentSession: {
    startTime: number;
    interactions: number;
    locations: string[];
    categories: string[];
  } = {
    startTime: Date.now(),
    interactions: 0,
    locations: [],
    categories: []
  };

  constructor() {
    this.loadBehaviorHistory();
    this.startSessionTracking();
  }

  // 分析用戶行為模式
  analyzeUserBehavior(): UserIntent {
    const currentTime = new Date();
    const hour = currentTime.getHours();
    const dayOfWeek = currentTime.getDay();

    // 基於時間的意圖推測
    let timeBasedIntent: UserIntent['type'] = 'exploration';
    let confidence = 0.6;

    if (hour >= 7 && hour < 10) {
      timeBasedIntent = 'movement';
      confidence = 0.8;
    } else if (hour >= 12 && hour < 14) {
      timeBasedIntent = 'entertainment';
      confidence = 0.7;
    } else if (hour >= 18 && hour < 22) {
      timeBasedIntent = 'entertainment';
      confidence = 0.9;
    } else if (hour >= 22 || hour < 6) {
      timeBasedIntent = 'information';
      confidence = 0.6;
    }

    const suggestedActions = this.generateSuggestedActions(timeBasedIntent, hour, dayOfWeek);

    return {
      type: timeBasedIntent,
      confidence,
      suggestedActions: suggestedActions.sort((a, b) => b.relevanceScore - a.relevanceScore)
    };
  }

  // 生成建議操作
  private generateSuggestedActions(intent: UserIntent['type'], hour: number, dayOfWeek: number): SuggestedAction[] {
    const actions: SuggestedAction[] = [];
    const player = gameStore.currentPlayer;

    // 時間基礎建議
    if (hour >= 7 && hour < 10) {
      actions.push({
        id: 'morning-nature',
        type: 'time_based',
        title: '晨間自然探索',
        description: '適合早晨的戶外活動地點',
        emoji: '🌅',
        action: () => this.handleQuickMove('陽明山'),
        priority: 1,
        relevanceScore: 0.9
      });

      actions.push({
        id: 'morning-exercise',
        type: 'time_based',
        title: '運動健身場所',
        description: '晨跑或運動的好去處',
        emoji: '🏃‍♂️',
        action: () => this.handleQuickMove('大安森林公園'),
        priority: 2,
        relevanceScore: 0.8
      });
    } else if (hour >= 12 && hour < 14) {
      actions.push({
        id: 'lunch-food',
        type: 'time_based',
        title: '午餐美食推薦',
        description: '附近的美食餐廳',
        emoji: '🍽️',
        action: () => this.handleCategoryExplore('food'),
        priority: 1,
        relevanceScore: 0.9
      });
    } else if (hour >= 18 && hour < 22) {
      actions.push({
        id: 'evening-nightmarket',
        type: 'time_based',
        title: '夜市美食之旅',
        description: '體驗台灣夜市文化',
        emoji: '🍜',
        action: () => this.handleQuickMove('士林夜市'),
        priority: 1,
        relevanceScore: 0.95
      });

      actions.push({
        id: 'evening-entertainment',
        type: 'time_based',
        title: '夜間娛樂',
        description: '適合夜晚的休閒活動',
        emoji: '🌃',
        action: () => this.handleQuickMove('信義商圈'),
        priority: 2,
        relevanceScore: 0.8
      });
    }

    // 週末特殊建議
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      actions.push({
        id: 'weekend-cultural',
        type: 'contextual',
        title: '週末文化之旅',
        description: '探索台灣文化古蹟',
        emoji: '🏛️',
        action: () => this.handleCategoryExplore('culture'),
        priority: 3,
        relevanceScore: 0.7
      });
    }

    // 位置相關建議
    if (player) {
      const nearbyActions = this.generateNearbyActions(player.latitude, player.longitude);
      actions.push(...nearbyActions);
    }

    // 個性化建議基於歷史
    const personalizedActions = this.generatePersonalizedActions();
    actions.push(...personalizedActions);

    return actions;
  }

  // 生成附近地點建議
  private generateNearbyActions(lat: number, lng: number): SuggestedAction[] {
    const actions: SuggestedAction[] = [];

    // 台北地區建議
    if (lat > 25.0 && lat < 25.2 && lng > 121.4 && lng < 121.7) {
      actions.push({
        id: 'nearby-101',
        type: 'contextual',
        title: '前往台北101',
        description: '台北著名地標',
        emoji: '🏙️',
        action: () => this.handleQuickMove('台北101'),
        priority: 4,
        relevanceScore: 0.8
      });

      actions.push({
        id: 'nearby-presidential',
        type: 'contextual',
        title: '參觀總統府',
        description: '歷史政治建築',
        emoji: '🏛️',
        action: () => this.handleQuickMove('總統府'),
        priority: 5,
        relevanceScore: 0.7
      });
    }

    return actions;
  }

  // 生成個性化建議
  private generatePersonalizedActions(): SuggestedAction[] {
    const actions: SuggestedAction[] = [];
    const recentPatterns = this.getRecentBehaviorPatterns();

    // 基於最近訪問的類別
    if (recentPatterns.preferredCategories.includes('food')) {
      actions.push({
        id: 'personalized-food',
        type: 'contextual',
        title: '更多美食探索',
        description: '根據您的喜好推薦',
        emoji: '🍴',
        action: () => this.handleCategoryExplore('food'),
        priority: 6,
        relevanceScore: 0.6
      });
    }

    if (recentPatterns.preferredCategories.includes('culture')) {
      actions.push({
        id: 'personalized-culture',
        type: 'contextual',
        title: '文化深度遊',
        description: '繼續您的文化探索',
        emoji: '🎭',
        action: () => this.handleCategoryExplore('culture'),
        priority: 7,
        relevanceScore: 0.6
      });
    }

    return actions;
  }

  // 預載相關數據
  preloadRelevantData(): void {
    const intent = this.analyzeUserBehavior();

    // 預載建議地點的詳細信息
    intent.suggestedActions.slice(0, 3).forEach(action => {
      // 可以在這裡預載地點詳細信息、圖片等
      console.debug(`預載數據: ${action.title}`);
    });
  }

  // 適應上下文
  adaptToContext(): any {
    const intent = this.analyzeUserBehavior();
    const currentTime = new Date();

    return {
      suggestedActions: intent.suggestedActions.slice(0, 4),
      timeContext: {
        hour: currentTime.getHours(),
        period: this.getTimePeriod(currentTime.getHours()),
        isWeekend: [0, 6].includes(currentTime.getDay())
      },
      userIntent: intent.type,
      confidence: intent.confidence
    };
  }

  // 記錄用戶交互
  recordInteraction(type: string, data: any): void {
    this.currentSession.interactions++;

    if (type === 'location_visit') {
      this.currentSession.locations.push(data.location);
    } else if (type === 'category_explore') {
      this.currentSession.categories.push(data.category);
    }

    // 每10次交互保存一次行為模式
    if (this.currentSession.interactions % 10 === 0) {
      this.saveBehaviorPattern();
    }
  }

  // 私有輔助方法
  private handleQuickMove(location: string): void {
    this.recordInteraction('location_visit', { location });
    // 觸發移動邏輯
    console.log(`智能建議移動到: ${location}`);
  }

  private handleCategoryExplore(category: string): void {
    this.recordInteraction('category_explore', { category });
    console.log(`智能建議探索分類: ${category}`);
  }

  private getTimePeriod(hour: number): string {
    if (hour >= 6 && hour < 10) return 'morning';
    if (hour >= 10 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  private getRecentBehaviorPatterns(): UserBehaviorPattern {
    const defaultPattern: UserBehaviorPattern = {
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      frequentLocations: [],
      preferredCategories: [],
      sessionDuration: 0,
      interactionFrequency: 0
    };

    if (this.behaviorHistory.length === 0) {
      return defaultPattern;
    }

    // 分析最近的行為模式
    const recent = this.behaviorHistory.slice(-5);
    const categories = recent.flatMap(p => p.preferredCategories);
    const locations = recent.flatMap(p => p.frequentLocations);

    return {
      ...defaultPattern,
      preferredCategories: [...new Set(categories)],
      frequentLocations: [...new Set(locations)]
    };
  }

  private loadBehaviorHistory(): void {
    try {
      const stored = localStorage.getItem('user_behavior_history');
      if (stored) {
        this.behaviorHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.debug('無法載入行為歷史:', error);
    }
  }

  private saveBehaviorPattern(): void {
    const pattern: UserBehaviorPattern = {
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      frequentLocations: [...new Set(this.currentSession.locations)],
      preferredCategories: [...new Set(this.currentSession.categories)],
      sessionDuration: Date.now() - this.currentSession.startTime,
      interactionFrequency: this.currentSession.interactions
    };

    this.behaviorHistory.push(pattern);

    // 只保留最近50個行為模式
    if (this.behaviorHistory.length > 50) {
      this.behaviorHistory = this.behaviorHistory.slice(-50);
    }

    try {
      localStorage.setItem('user_behavior_history', JSON.stringify(this.behaviorHistory));
    } catch (error) {
      console.debug('無法保存行為模式:', error);
    }
  }

  private startSessionTracking(): void {
    // 每分鐘更新一次預測
    setInterval(() => {
      this.preloadRelevantData();
    }, 60000);

    // 頁面卸載時保存當前會話
    window.addEventListener('beforeunload', () => {
      this.saveBehaviorPattern();
    });
  }
}

// 創建全局預測引擎實例
export const predictionEngine = new PredictionEngine();