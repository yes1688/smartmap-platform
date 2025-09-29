import { gameStore } from '@/stores/gameStore';

export interface UserPreference {
  category: string;
  weight: number;
  lastUpdated: number;
  frequency: number;
}

export interface PersonalizedRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  emoji: string;
  score: number;
  reasoning: string[];
  timeOfDay?: 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';
  weatherSuitability?: 'any' | 'sunny' | 'cloudy' | 'rainy';
}

export interface UserProfile {
  userId: string;
  preferences: UserPreference[];
  visitHistory: VisitRecord[];
  timePatterns: TimePattern[];
  favoriteLocations: string[];
  personalityTraits: PersonalityTrait[];
}

export interface VisitRecord {
  location: string;
  category: string;
  timestamp: number;
  duration: number;
  rating?: number;
}

export interface TimePattern {
  hour: number;
  dayOfWeek: number;
  preferredActivity: string;
  frequency: number;
}

export interface PersonalityTrait {
  trait: 'explorer' | 'foodie' | 'culture_lover' | 'nature_enthusiast' | 'social' | 'contemplative';
  score: number;
}

export class PersonalizationEngine {
  private userProfile: UserProfile;
  private recommendationCache: Map<string, PersonalizedRecommendation[]> = new Map();
  private cacheExpiry: number = 30 * 60 * 1000; // 30分鐘

  constructor(userId: string) {
    this.userProfile = this.loadUserProfile(userId);
    this.startPersonalityAnalysis();
  }

  // 生成個性化推薦
  generatePersonalizedRecommendations(limit: number = 6): PersonalizedRecommendation[] {
    const cacheKey = `${Date.now()}_${limit}`;
    const cached = this.recommendationCache.get(cacheKey);

    if (cached && this.isCacheValid(cacheKey)) {
      return cached;
    }

    const recommendations = this.computeRecommendations(limit);
    this.recommendationCache.set(cacheKey, recommendations);

    return recommendations;
  }

  // 計算推薦
  private computeRecommendations(limit: number): PersonalizedRecommendation[] {
    const currentTime = new Date();
    const hour = currentTime.getHours();
    const dayOfWeek = currentTime.getDay();

    const baseRecommendations = this.getBaseRecommendations();
    const scoredRecommendations = baseRecommendations.map(rec => ({
      ...rec,
      score: this.calculateRecommendationScore(rec, hour, dayOfWeek)
    }));

    return scoredRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // 基礎推薦數據
  private getBaseRecommendations(): Omit<PersonalizedRecommendation, 'score'>[] {
    return [
      {
        id: 'taipei-101',
        title: '台北101觀景台',
        description: '俯瞰台北全景，享受城市之美',
        category: 'landmark',
        location: '台北101',
        emoji: '🏙️',
        reasoning: ['城市地標', '觀景體驗', '拍照聖地'],
        timeOfDay: 'evening',
        weatherSuitability: 'any'
      },
      {
        id: 'shilin-night-market',
        title: '士林夜市美食探索',
        description: '品嚐台灣道地小吃與夜市文化',
        category: 'food',
        location: '士林夜市',
        emoji: '🍜',
        reasoning: ['美食體驗', '文化探索', '夜間活動'],
        timeOfDay: 'evening',
        weatherSuitability: 'any'
      },
      {
        id: 'yangmingshan',
        title: '陽明山自然步道',
        description: '享受大自然，呼吸新鮮空氣',
        category: 'nature',
        location: '陽明山',
        emoji: '🌲',
        reasoning: ['自然體驗', '健康活動', '美景欣賞'],
        timeOfDay: 'morning',
        weatherSuitability: 'sunny'
      },
      {
        id: 'national-palace-museum',
        title: '故宮博物院文化之旅',
        description: '探索中華文化瑰寶',
        category: 'culture',
        location: '故宮博物院',
        emoji: '🏛️',
        reasoning: ['文化學習', '歷史探索', '藝術欣賞'],
        timeOfDay: 'afternoon',
        weatherSuitability: 'any'
      },
      {
        id: 'tamsui-old-street',
        title: '淡水老街河岸漫步',
        description: '欣賞淡水河美景，感受歷史韻味',
        category: 'culture',
        location: '淡水老街',
        emoji: '🌊',
        reasoning: ['歷史文化', '河景欣賞', '悠閒漫步'],
        timeOfDay: 'afternoon',
        weatherSuitability: 'sunny'
      },
      {
        id: 'jiufen',
        title: '九份山城懷舊之旅',
        description: '體驗山城風情，品嚐傳統茶點',
        category: 'culture',
        location: '九份老街',
        emoji: '⛰️',
        reasoning: ['懷舊氛圍', '山景欣賞', '文化體驗'],
        timeOfDay: 'afternoon',
        weatherSuitability: 'cloudy'
      },
      {
        id: 'ximending',
        title: '西門町流行文化',
        description: '感受年輕活力，探索流行趨勢',
        category: 'shopping',
        location: '西門町',
        emoji: '🛍️',
        reasoning: ['購物體驗', '流行文化', '年輕活力'],
        timeOfDay: 'afternoon',
        weatherSuitability: 'any'
      },
      {
        id: 'longshan-temple',
        title: '龍山寺祈福體驗',
        description: '感受台灣傳統宗教文化',
        category: 'culture',
        location: '龍山寺',
        emoji: '🏮',
        reasoning: ['宗教文化', '心靈體驗', '傳統建築'],
        timeOfDay: 'morning',
        weatherSuitability: 'any'
      }
    ];
  }

  // 計算推薦分數
  private calculateRecommendationScore(
    rec: Omit<PersonalizedRecommendation, 'score'>,
    hour: number,
    dayOfWeek: number
  ): number {
    let score = 0.5; // 基礎分數

    // 時間匹配度
    score += this.getTimeMatchScore(rec, hour);

    // 個人偏好匹配度
    score += this.getPreferenceMatchScore(rec);

    // 個性特質匹配度
    score += this.getPersonalityMatchScore(rec);

    // 訪問歷史影響
    score += this.getHistoryInfluenceScore(rec);

    // 時間模式匹配
    score += this.getTimePatternScore(rec, hour, dayOfWeek);

    // 新鮮度獎勵（避免重複推薦）
    score += this.getFreshnessScore(rec);

    return Math.min(Math.max(score, 0), 1); // 限制在0-1之間
  }

  // 時間匹配分數
  private getTimeMatchScore(rec: Omit<PersonalizedRecommendation, 'score'>, hour: number): number {
    if (!rec.timeOfDay) return 0;

    const timeRanges = {
      morning: [6, 11],
      noon: [11, 14],
      afternoon: [14, 18],
      evening: [18, 22],
      night: [22, 6]
    };

    const [start, end] = timeRanges[rec.timeOfDay];
    const isInRange = (start <= end)
      ? hour >= start && hour < end
      : hour >= start || hour < end;

    return isInRange ? 0.2 : -0.1;
  }

  // 偏好匹配分數
  private getPreferenceMatchScore(rec: Omit<PersonalizedRecommendation, 'score'>): number {
    const preference = this.userProfile.preferences.find(p => p.category === rec.category);
    if (!preference) return 0;

    return preference.weight * 0.3;
  }

  // 個性特質匹配分數
  private getPersonalityMatchScore(rec: Omit<PersonalizedRecommendation, 'score'>): number {
    const categoryTraitMap: Record<string, PersonalityTrait['trait'][]> = {
      food: ['foodie', 'social'],
      culture: ['culture_lover', 'contemplative'],
      nature: ['nature_enthusiast', 'contemplative'],
      landmark: ['explorer', 'social'],
      shopping: ['social', 'explorer']
    };

    const relevantTraits = categoryTraitMap[rec.category] || [];
    let score = 0;

    relevantTraits.forEach(traitName => {
      const trait = this.userProfile.personalityTraits.find(t => t.trait === traitName);
      if (trait) {
        score += trait.score * 0.15;
      }
    });

    return score;
  }

  // 歷史影響分數
  private getHistoryInfluenceScore(rec: Omit<PersonalizedRecommendation, 'score'>): number {
    const recentVisits = this.userProfile.visitHistory.filter(
      visit => visit.category === rec.category &&
      Date.now() - visit.timestamp < 7 * 24 * 60 * 60 * 1000 // 最近7天
    );

    if (recentVisits.length === 0) return 0.1; // 新體驗獎勵

    const avgRating = recentVisits.reduce((sum, visit) => sum + (visit.rating || 0.5), 0) / recentVisits.length;
    return avgRating > 0.7 ? 0.15 : -0.05;
  }

  // 時間模式分數
  private getTimePatternScore(
    rec: Omit<PersonalizedRecommendation, 'score'>,
    hour: number,
    dayOfWeek: number
  ): number {
    const pattern = this.userProfile.timePatterns.find(
      p => Math.abs(p.hour - hour) <= 1 && p.dayOfWeek === dayOfWeek
    );

    if (!pattern) return 0;

    return pattern.preferredActivity === rec.category ? 0.1 : 0;
  }

  // 新鮮度分數
  private getFreshnessScore(rec: Omit<PersonalizedRecommendation, 'score'>): number {
    const recentRecommendations = Array.from(this.recommendationCache.values())
      .flat()
      .filter(r => r.id === rec.id);

    return Math.max(0, 0.1 - recentRecommendations.length * 0.02);
  }

  // 更新用戶偏好
  updateUserPreference(category: string, interaction: 'positive' | 'negative' | 'neutral'): void {
    const existingIndex = this.userProfile.preferences.findIndex(p => p.category === category);
    const weightChange = interaction === 'positive' ? 0.1 : interaction === 'negative' ? -0.05 : 0;

    if (existingIndex >= 0) {
      this.userProfile.preferences[existingIndex].weight = Math.min(
        Math.max(this.userProfile.preferences[existingIndex].weight + weightChange, 0),
        1
      );
      this.userProfile.preferences[existingIndex].frequency++;
      this.userProfile.preferences[existingIndex].lastUpdated = Date.now();
    } else {
      this.userProfile.preferences.push({
        category,
        weight: 0.5 + weightChange,
        lastUpdated: Date.now(),
        frequency: 1
      });
    }

    this.saveUserProfile();
    this.clearRecommendationCache();
  }

  // 記錄訪問
  recordVisit(location: string, category: string, duration: number, rating?: number): void {
    const visit: VisitRecord = {
      location,
      category,
      timestamp: Date.now(),
      duration,
      rating
    };

    this.userProfile.visitHistory.push(visit);

    // 只保留最近100次訪問
    if (this.userProfile.visitHistory.length > 100) {
      this.userProfile.visitHistory = this.userProfile.visitHistory.slice(-100);
    }

    // 更新時間模式
    this.updateTimePattern(category);

    // 更新個性特質
    this.updatePersonalityTraits(category, duration, rating);

    this.saveUserProfile();
  }

  // 更新時間模式
  private updateTimePattern(category: string): void {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    const existingPattern = this.userProfile.timePatterns.find(
      p => p.hour === hour && p.dayOfWeek === dayOfWeek
    );

    if (existingPattern) {
      if (existingPattern.preferredActivity === category) {
        existingPattern.frequency++;
      }
    } else {
      this.userProfile.timePatterns.push({
        hour,
        dayOfWeek,
        preferredActivity: category,
        frequency: 1
      });
    }
  }

  // 更新個性特質
  private updatePersonalityTraits(category: string, duration: number, rating?: number): void {
    const categoryTraitMap: Record<string, { trait: PersonalityTrait['trait'], factor: number }[]> = {
      food: [{ trait: 'foodie', factor: 1.0 }, { trait: 'social', factor: 0.5 }],
      culture: [{ trait: 'culture_lover', factor: 1.0 }, { trait: 'contemplative', factor: 0.7 }],
      nature: [{ trait: 'nature_enthusiast', factor: 1.0 }, { trait: 'contemplative', factor: 0.6 }],
      landmark: [{ trait: 'explorer', factor: 1.0 }, { trait: 'social', factor: 0.4 }],
      shopping: [{ trait: 'social', factor: 0.8 }, { trait: 'explorer', factor: 0.6 }]
    };

    const relevantTraits = categoryTraitMap[category] || [];

    relevantTraits.forEach(({ trait, factor }) => {
      const existingTrait = this.userProfile.personalityTraits.find(t => t.trait === trait);
      const scoreChange = (duration / 60000) * factor * 0.01; // 基於停留時間

      if (existingTrait) {
        existingTrait.score = Math.min(existingTrait.score + scoreChange, 1);
      } else {
        this.userProfile.personalityTraits.push({
          trait,
          score: scoreChange
        });
      }
    });
  }

  // 載入用戶檔案
  private loadUserProfile(userId: string): UserProfile {
    try {
      const stored = localStorage.getItem(`user_profile_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.debug('無法載入用戶檔案:', error);
    }

    return {
      userId,
      preferences: [],
      visitHistory: [],
      timePatterns: [],
      favoriteLocations: [],
      personalityTraits: []
    };
  }

  // 保存用戶檔案
  private saveUserProfile(): void {
    try {
      localStorage.setItem(
        `user_profile_${this.userProfile.userId}`,
        JSON.stringify(this.userProfile)
      );
    } catch (error) {
      console.debug('無法保存用戶檔案:', error);
    }
  }

  // 開始個性分析
  private startPersonalityAnalysis(): void {
    // 基於遊戲行為分析個性
    const player = gameStore.currentPlayer;
    if (player) {
      // 可以基於遊戲統計分析用戶個性
      // 這裡暫時省略具體實現
    }
  }

  // 清除推薦緩存
  private clearRecommendationCache(): void {
    this.recommendationCache.clear();
  }

  // 檢查緩存是否有效
  private isCacheValid(cacheKey: string): boolean {
    // 簡化的緩存有效性檢查
    return false; // 暫時總是重新計算，確保個性化效果
  }

  // 獲取用戶檔案摘要
  getUserProfileSummary(): any {
    return {
      userId: this.userProfile.userId,
      topPreferences: this.userProfile.preferences
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3),
      topPersonalityTraits: this.userProfile.personalityTraits
        .sort((a, b) => b.score - a.score)
        .slice(0, 3),
      totalVisits: this.userProfile.visitHistory.length,
      favoriteLocations: this.userProfile.favoriteLocations.slice(0, 5)
    };
  }
}

// 創建全局個性化引擎實例
export const createPersonalizationEngine = (userId: string) => new PersonalizationEngine(userId);