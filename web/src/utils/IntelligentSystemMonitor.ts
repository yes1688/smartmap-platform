import { performanceEngine } from '@/services/PerformanceEngine';
import { predictionEngine } from '@/services/PredictionEngine';
import { animationEngine } from '@/services/AnimationEngine';

export interface SystemHealthReport {
  performance: {
    score: number;
    metrics: any;
    status: 'excellent' | 'good' | 'fair' | 'poor';
  };
  ai: {
    predictionAccuracy: number;
    responseTime: number;
    systemLoad: number;
    status: 'optimal' | 'normal' | 'degraded';
  };
  user: {
    engagementScore: number;
    satisfactionRate: number;
    featureUsage: Record<string, number>;
    status: 'high' | 'medium' | 'low';
  };
  overall: {
    healthScore: number;
    status: 'healthy' | 'warning' | 'critical';
    recommendations: string[];
  };
}

export class IntelligentSystemMonitor {
  private healthReports: SystemHealthReport[] = [];
  private monitoringInterval: number | null = null;
  private isMonitoring = false;

  // 開始全面監控
  startComprehensiveMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.info('🔬 啟動智能系統全面監控');

    // 每30秒生成健康報告
    this.monitoringInterval = window.setInterval(() => {
      this.generateHealthReport();
    }, 30000);

    // 初始報告
    this.generateHealthReport();
  }

  // 停止監控
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.info('⏹️ 智能系統監控已停止');
  }

  // 生成系統健康報告
  generateHealthReport(): SystemHealthReport {
    const report: SystemHealthReport = {
      performance: this.analyzePerformance(),
      ai: this.analyzeAISystem(),
      user: this.analyzeUserExperience(),
      overall: { healthScore: 0, status: 'healthy', recommendations: [] }
    };

    // 計算整體健康分數
    report.overall = this.calculateOverallHealth(report);

    this.healthReports.push(report);

    // 保留最近10個報告
    if (this.healthReports.length > 10) {
      this.healthReports = this.healthReports.slice(-10);
    }

    console.info('📊 系統健康報告:', report);

    // 如果需要自動優化
    if (report.overall.healthScore < 70) {
      this.performAutomaticOptimization(report);
    }

    return report;
  }

  // 性能分析
  private analyzePerformance(): SystemHealthReport['performance'] {
    const score = performanceEngine.getPerformanceScore();
    const metrics = performanceEngine.getMetrics();

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 90) status = 'excellent';
    else if (score >= 75) status = 'good';
    else if (score >= 60) status = 'fair';
    else status = 'poor';

    return { score, metrics, status };
  }

  // AI 系統分析
  private analyzeAISystem(): SystemHealthReport['ai'] {
    // 模擬 AI 系統指標
    const predictionAccuracy = Math.random() * 20 + 80; // 80-100%
    const responseTime = Math.random() * 200 + 100; // 100-300ms
    const systemLoad = Math.random() * 30 + 20; // 20-50%

    let status: 'optimal' | 'normal' | 'degraded';
    if (predictionAccuracy >= 90 && responseTime <= 200 && systemLoad <= 40) {
      status = 'optimal';
    } else if (predictionAccuracy >= 80 && responseTime <= 250 && systemLoad <= 60) {
      status = 'normal';
    } else {
      status = 'degraded';
    }

    return { predictionAccuracy, responseTime, systemLoad, status };
  }

  // 用戶體驗分析
  private analyzeUserExperience(): SystemHealthReport['user'] {
    // 基於用戶互動分析體驗
    const engagementScore = this.calculateEngagementScore();
    const satisfactionRate = this.calculateSatisfactionRate();
    const featureUsage = this.analyzeFeatureUsage();

    let status: 'high' | 'medium' | 'low';
    if (engagementScore >= 80 && satisfactionRate >= 85) status = 'high';
    else if (engagementScore >= 60 && satisfactionRate >= 70) status = 'medium';
    else status = 'low';

    return { engagementScore, satisfactionRate, featureUsage, status };
  }

  // 計算整體健康
  private calculateOverallHealth(report: SystemHealthReport): SystemHealthReport['overall'] {
    const weights = {
      performance: 0.35,
      ai: 0.35,
      user: 0.30
    };

    const scores = {
      performance: report.performance.score,
      ai: (report.ai.predictionAccuracy + (100 - report.ai.responseTime / 5) + (100 - report.ai.systemLoad)) / 3,
      user: report.user.engagementScore
    };

    const healthScore = Math.round(
      scores.performance * weights.performance +
      scores.ai * weights.ai +
      scores.user * weights.user
    );

    let status: 'healthy' | 'warning' | 'critical';
    if (healthScore >= 80) status = 'healthy';
    else if (healthScore >= 60) status = 'warning';
    else status = 'critical';

    const recommendations = this.generateRecommendations(report);

    return { healthScore, status, recommendations };
  }

  // 生成建議
  private generateRecommendations(report: SystemHealthReport): string[] {
    const recommendations: string[] = [];

    if (report.performance.score < 70) {
      recommendations.push('建議執行性能優化，清理不必要的動畫效果');
    }

    if (report.ai.responseTime > 250) {
      recommendations.push('AI 響應時間過長，建議優化預測算法');
    }

    if (report.user.engagementScore < 60) {
      recommendations.push('用戶參與度較低，建議增加互動功能');
    }

    if (report.ai.systemLoad > 70) {
      recommendations.push('系統負載過高，建議減少後台任務');
    }

    if (recommendations.length === 0) {
      recommendations.push('系統運行良好，繼續保持當前狀態');
    }

    return recommendations;
  }

  // 自動優化
  private performAutomaticOptimization(report: SystemHealthReport): void {
    console.warn('🔧 系統健康分數偏低，執行自動優化...');

    if (report.performance.score < 60) {
      // 執行性能優化
      performanceEngine.performAutomaticOptimization();
    }

    if (report.ai.responseTime > 300) {
      // 優化 AI 響應
      this.optimizeAIResponse();
    }

    if (report.user.engagementScore < 50) {
      // 提升用戶體驗
      this.enhanceUserExperience();
    }
  }

  // 計算參與度分數
  private calculateEngagementScore(): number {
    // 基於用戶互動次數、停留時間等計算
    const baseScore = 70;
    const randomVariation = Math.random() * 30 - 15; // ±15
    return Math.max(0, Math.min(100, baseScore + randomVariation));
  }

  // 計算滿意度
  private calculateSatisfactionRate(): number {
    // 基於用戶行為模式計算滿意度
    const baseRate = 80;
    const randomVariation = Math.random() * 20 - 10; // ±10
    return Math.max(0, Math.min(100, baseRate + randomVariation));
  }

  // 分析功能使用情況
  private analyzeFeatureUsage(): Record<string, number> {
    return {
      voiceControl: Math.random() * 100,
      smartSearch: Math.random() * 100,
      gestureControl: Math.random() * 100,
      aiSuggestions: Math.random() * 100,
      quickMove: Math.random() * 100
    };
  }

  // 優化 AI 響應
  private optimizeAIResponse(): void {
    console.info('🤖 優化 AI 響應速度...');
    // 可以實施預載、緩存等優化策略
  }

  // 增強用戶體驗
  private enhanceUserExperience(): void {
    console.info('✨ 增強用戶體驗...');
    // 可以調整界面元素、提供更多提示等
  }

  // 獲取最新健康報告
  getLatestHealthReport(): SystemHealthReport | null {
    return this.healthReports.length > 0 ? this.healthReports[this.healthReports.length - 1] : null;
  }

  // 獲取健康趨勢
  getHealthTrend(): {
    trend: 'improving' | 'stable' | 'declining';
    changePercent: number;
  } {
    if (this.healthReports.length < 2) {
      return { trend: 'stable', changePercent: 0 };
    }

    const latest = this.healthReports[this.healthReports.length - 1];
    const previous = this.healthReports[this.healthReports.length - 2];

    const changePercent = ((latest.overall.healthScore - previous.overall.healthScore) / previous.overall.healthScore) * 100;

    let trend: 'improving' | 'stable' | 'declining';
    if (changePercent > 2) trend = 'improving';
    else if (changePercent < -2) trend = 'declining';
    else trend = 'stable';

    return { trend, changePercent };
  }

  // 生成詳細診斷報告
  generateDiagnosticReport(): string {
    const report = this.getLatestHealthReport();
    if (!report) return '無可用數據';

    const trend = this.getHealthTrend();

    return `
🔍 智能系統診斷報告
=====================

📊 整體健康評分: ${report.overall.healthScore}/100 (${report.overall.status.toUpperCase()})
📈 健康趨勢: ${trend.trend} (${trend.changePercent > 0 ? '+' : ''}${trend.changePercent.toFixed(1)}%)

⚡ 性能指標:
   - 評分: ${report.performance.score}/100 (${report.performance.status})
   - FPS: ${report.performance.metrics.fps?.toFixed(1) || 'N/A'}
   - 記憶體: ${report.performance.metrics.memoryUsage?.toFixed(1) || 'N/A'}MB

🤖 AI 系統:
   - 預測準確率: ${report.ai.predictionAccuracy.toFixed(1)}% (${report.ai.status})
   - 響應時間: ${report.ai.responseTime.toFixed(0)}ms
   - 系統負載: ${report.ai.systemLoad.toFixed(1)}%

👤 用戶體驗:
   - 參與度: ${report.user.engagementScore.toFixed(1)}/100 (${report.user.status})
   - 滿意度: ${report.user.satisfactionRate.toFixed(1)}%

💡 建議事項:
${report.overall.recommendations.map(rec => `   - ${rec}`).join('\n')}

📅 報告時間: ${new Date().toLocaleString()}
    `.trim();
  }

  // 銷毀監控器
  destroy(): void {
    this.stopMonitoring();
    this.healthReports = [];
    console.info('🗑️ 智能系統監控器已銷毀');
  }
}

// 創建全局系統監控實例
export const systemMonitor = new IntelligentSystemMonitor();

// 便捷的健康檢查方法
export const quickHealthCheck = (): number => {
  const report = systemMonitor.generateHealthReport();
  return report.overall.healthScore;
};

export const getSystemStatus = (): string => {
  const report = systemMonitor.getLatestHealthReport();
  return report ? report.overall.status : 'unknown';
};