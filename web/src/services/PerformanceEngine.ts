export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  fps: number;
  loadTime: number;
  interactionLatency: number;
  bundleSize: number;
}

export interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  threshold: number;
  action: () => void;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  network: number;
  dom: {
    nodes: number;
    listeners: number;
    mutations: number;
  };
}

export class PerformanceEngine {
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    memoryUsage: 0,
    fps: 0,
    loadTime: 0,
    interactionLatency: 0,
    bundleSize: 0
  };

  private frameCount = 0;
  private lastFrameTime = 0;
  private fpsHistory: number[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private optimizationRules: OptimizationRule[] = [];
  private isMonitoring = false;
  private resourceUsage: ResourceUsage = {
    cpu: 0,
    memory: 0,
    network: 0,
    dom: { nodes: 0, listeners: 0, mutations: 0 }
  };

  constructor() {
    this.initializeOptimizationRules();
    this.setupPerformanceObservers();
  }

  // 開始性能監控
  startMonitoring(): void {
    this.isMonitoring = true;
    this.startFPSMonitoring();
    this.startMemoryMonitoring();
    this.startRenderTimeMonitoring();
    this.startInteractionMonitoring();
    this.startDOMMonitoring();
    console.info('🚀 性能監控已啟動');
  }

  // 停止性能監控
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    console.info('⏹️ 性能監控已停止');
  }

  // 獲取當前性能指標
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // 獲取性能評分 (0-100)
  getPerformanceScore(): number {
    const weights = {
      fps: 0.3,        // FPS 權重 30%
      memory: 0.25,    // 記憶體權重 25%
      render: 0.25,    // 渲染時間權重 25%
      interaction: 0.2  // 交互延遲權重 20%
    };

    const scores = {
      fps: this.calculateFPSScore(),
      memory: this.calculateMemoryScore(),
      render: this.calculateRenderScore(),
      interaction: this.calculateInteractionScore()
    };

    return Math.round(
      scores.fps * weights.fps +
      scores.memory * weights.memory +
      scores.render * weights.render +
      scores.interaction * weights.interaction
    );
  }

  // 自動優化
  performAutomaticOptimization(): void {
    const score = this.getPerformanceScore();
    console.info(`📊 當前性能評分: ${score}/100`);

    if (score < 60) {
      console.warn('⚠️ 性能較差，執行自動優化...');
      this.executeOptimizationRules();
    } else if (score < 80) {
      console.info('💡 性能一般，執行輕量優化...');
      this.executeLowPriorityOptimizations();
    } else {
      console.info('✅ 性能良好，無需優化');
    }
  }

  // 預載優化
  preloadOptimization(resources: string[]): Promise<void> {
    const preloadPromises = resources.map(resource => {
      return new Promise<void>((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;

        if (resource.endsWith('.js')) {
          link.as = 'script';
        } else if (resource.endsWith('.css')) {
          link.as = 'style';
        } else if (/\.(jpg|jpeg|png|webp|avif)$/i.test(resource)) {
          link.as = 'image';
        }

        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to preload ${resource}`));

        document.head.appendChild(link);
      });
    });

    return Promise.all(preloadPromises).then(() => {
      console.info(`✅ 預載完成: ${resources.length} 個資源`);
    });
  }

  // 圖片懶加載優化
  optimizeImageLoading(): void {
    const images = document.querySelectorAll('img[data-src]');

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src!;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      // 後備方案：立即加載所有圖片
      images.forEach(img => {
        const imgElement = img as HTMLImageElement;
        imgElement.src = imgElement.dataset.src!;
        imgElement.removeAttribute('data-src');
      });
    }
  }

  // 組件級性能分析
  analyzeComponentPerformance(componentName: string): void {
    const mark = `${componentName}-start`;
    const endMark = `${componentName}-end`;

    performance.mark(mark);

    // 組件渲染完成後呼叫
    requestAnimationFrame(() => {
      performance.mark(endMark);
      performance.measure(componentName, mark, endMark);

      const measure = performance.getEntriesByName(componentName)[0];
      if (measure) {
        console.debug(`📱 組件 ${componentName} 渲染時間: ${measure.duration.toFixed(2)}ms`);
      }
    });
  }

  // 記憶體洩漏檢測
  detectMemoryLeaks(): void {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const usage = {
        used: memInfo.usedJSHeapSize,
        total: memInfo.totalJSHeapSize,
        limit: memInfo.jsHeapSizeLimit
      };

      const usagePercent = (usage.used / usage.limit) * 100;

      if (usagePercent > 80) {
        console.warn('🚨 記憶體使用率過高:', usagePercent.toFixed(2) + '%');
        this.performMemoryOptimization();
      }

      this.resourceUsage.memory = usagePercent;
    }
  }

  // 網路性能優化
  optimizeNetworkRequests(): void {
    // 請求去重
    const pendingRequests = new Map<string, Promise<any>>();

    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input.toString();

      if (pendingRequests.has(url)) {
        return pendingRequests.get(url)!;
      }

      const request = originalFetch.call(this, input, init);
      pendingRequests.set(url, request);

      request.finally(() => {
        pendingRequests.delete(url);
      });

      return request;
    };
  }

  // 批次 DOM 操作優化
  batchDOMOperations(operations: Array<() => void>): void {
    // 使用 documentFragment 批次操作
    requestAnimationFrame(() => {
      const fragment = document.createDocumentFragment();
      const tempContainer = document.createElement('div');
      fragment.appendChild(tempContainer);

      operations.forEach(operation => {
        try {
          operation();
        } catch (error) {
          console.error('DOM 操作錯誤:', error);
        }
      });
    });
  }

  // 私有方法
  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      {
        id: 'low-fps',
        name: 'FPS 過低優化',
        description: '當 FPS 低於 30 時觸發',
        threshold: 30,
        action: () => {
          console.warn('🎯 執行 FPS 優化...');
          this.reduceFPSLoad();
        },
        priority: 'high'
      },
      {
        id: 'high-memory',
        name: '記憶體使用過高優化',
        description: '當記憶體使用超過 70% 時觸發',
        threshold: 70,
        action: () => {
          console.warn('🧹 執行記憶體清理...');
          this.performMemoryOptimization();
        },
        priority: 'critical'
      },
      {
        id: 'slow-render',
        name: '渲染速度優化',
        description: '當渲染時間超過 16ms 時觸發',
        threshold: 16,
        action: () => {
          console.warn('⚡ 執行渲染優化...');
          this.optimizeRendering();
        },
        priority: 'medium'
      },
      {
        id: 'high-interaction-latency',
        name: '交互延遲優化',
        description: '當交互延遲超過 100ms 時觸發',
        threshold: 100,
        action: () => {
          console.warn('🎮 執行交互優化...');
          this.optimizeInteractions();
        },
        priority: 'medium'
      }
    ];
  }

  private setupPerformanceObservers(): void {
    // 設置 Long Task 觀察器
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            if (entry.duration > 50) {
              console.warn(`⏱️ 長任務檢測: ${entry.duration.toFixed(2)}ms`);
            }
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (error) {
        console.debug('Long Task API 不支援');
      }

      // 設置 Layout Shift 觀察器
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            if ((entry as any).value > 0.1) {
              console.warn(`📐 布局偏移檢測: ${(entry as any).value.toFixed(3)}`);
            }
          });
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('layout-shift', layoutShiftObserver);
      } catch (error) {
        console.debug('Layout Shift API 不支援');
      }
    }
  }

  private startFPSMonitoring(): void {
    const measureFPS = () => {
      if (!this.isMonitoring) return;

      const currentTime = performance.now();
      if (this.lastFrameTime > 0) {
        const deltaTime = currentTime - this.lastFrameTime;
        const fps = 1000 / deltaTime;
        this.fpsHistory.push(fps);

        if (this.fpsHistory.length > 60) {
          this.fpsHistory.shift();
        }

        this.metrics.fps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
      }

      this.lastFrameTime = currentTime;
      this.frameCount++;
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  private startMemoryMonitoring(): void {
    const monitorMemory = () => {
      if (!this.isMonitoring) return;

      this.detectMemoryLeaks();
      setTimeout(monitorMemory, 5000); // 每5秒檢測一次
    };

    monitorMemory();
  }

  private startRenderTimeMonitoring(): void {
    // 監控主要渲染性能
    const measureRenderTime = () => {
      if (!this.isMonitoring) return;

      const paintEntries = performance.getEntriesByType('paint');
      const lastPaint = paintEntries[paintEntries.length - 1];

      if (lastPaint) {
        this.metrics.renderTime = lastPaint.startTime;
      }

      setTimeout(measureRenderTime, 1000);
    };

    measureRenderTime();
  }

  private startInteractionMonitoring(): void {
    let interactionStart = 0;

    const events = ['click', 'touchstart', 'keydown'];

    events.forEach(eventType => {
      document.addEventListener(eventType, () => {
        interactionStart = performance.now();
      }, { passive: true });
    });

    // 監控響應時間
    const observer = new MutationObserver(() => {
      if (interactionStart > 0) {
        this.metrics.interactionLatency = performance.now() - interactionStart;
        interactionStart = 0;
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
  }

  private startDOMMonitoring(): void {
    const updateDOMMetrics = () => {
      this.resourceUsage.dom = {
        nodes: document.querySelectorAll('*').length,
        listeners: this.estimateEventListeners(),
        mutations: 0 // 需要通過 MutationObserver 統計
      };
    };

    updateDOMMetrics();
    setInterval(updateDOMMetrics, 10000); // 每10秒更新一次
  }

  private estimateEventListeners(): number {
    // 簡化的事件監聽器估算
    return document.querySelectorAll('[onclick], [onload], [onchange]').length;
  }

  private calculateFPSScore(): number {
    const fps = this.metrics.fps;
    if (fps >= 60) return 100;
    if (fps >= 45) return 80;
    if (fps >= 30) return 60;
    if (fps >= 15) return 40;
    return 20;
  }

  private calculateMemoryScore(): number {
    const usage = this.resourceUsage.memory;
    if (usage <= 30) return 100;
    if (usage <= 50) return 80;
    if (usage <= 70) return 60;
    if (usage <= 85) return 40;
    return 20;
  }

  private calculateRenderScore(): number {
    const renderTime = this.metrics.renderTime;
    if (renderTime <= 8) return 100;
    if (renderTime <= 16) return 80;
    if (renderTime <= 32) return 60;
    if (renderTime <= 50) return 40;
    return 20;
  }

  private calculateInteractionScore(): number {
    const latency = this.metrics.interactionLatency;
    if (latency <= 50) return 100;
    if (latency <= 100) return 80;
    if (latency <= 200) return 60;
    if (latency <= 500) return 40;
    return 20;
  }

  private executeOptimizationRules(): void {
    const criticalRules = this.optimizationRules
      .filter(rule => rule.priority === 'critical')
      .sort((a, b) => a.threshold - b.threshold);

    criticalRules.forEach(rule => {
      try {
        rule.action();
      } catch (error) {
        console.error(`優化規則執行失敗 ${rule.name}:`, error);
      }
    });
  }

  private executeLowPriorityOptimizations(): void {
    const lowPriorityRules = this.optimizationRules
      .filter(rule => rule.priority === 'low' || rule.priority === 'medium');

    lowPriorityRules.forEach(rule => {
      try {
        rule.action();
      } catch (error) {
        console.error(`優化規則執行失敗 ${rule.name}:`, error);
      }
    });
  }

  private reduceFPSLoad(): void {
    // 降低動畫品質
    document.documentElement.style.setProperty('--animation-duration', '0.5s');

    // 減少不必要的重繪
    const elements = document.querySelectorAll('[style*="animation"]');
    elements.forEach(el => {
      (el as HTMLElement).style.animationDuration = '0.3s';
    });
  }

  private performMemoryOptimization(): void {
    // 清理未使用的資源
    if ('gc' in window) {
      (window as any).gc();
    }

    // 清理 console
    if (console.clear) {
      console.clear();
    }

    // 建議垃圾回收
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        // 執行低優先級清理任務
      });
    }
  }

  private optimizeRendering(): void {
    // 啟用 CSS containment
    document.documentElement.style.contain = 'layout style paint';

    // 使用 GPU 加速
    const heavyElements = document.querySelectorAll('.gpu-accelerate');
    heavyElements.forEach(el => {
      (el as HTMLElement).style.willChange = 'transform';
    });
  }

  private optimizeInteractions(): void {
    // 去抖動處理
    const debouncedEvents = ['scroll', 'resize', 'mousemove'];

    debouncedEvents.forEach(eventType => {
      let timeout: number;
      document.addEventListener(eventType, () => {
        clearTimeout(timeout);
        timeout = window.setTimeout(() => {
          // 處理事件
        }, 16); // 大約 60fps
      }, { passive: true });
    });
  }

  // 銷毀性能引擎
  destroy(): void {
    this.stopMonitoring();
    console.info('🔧 性能引擎已銷毀');
  }
}

// 創建全局性能引擎實例
export const performanceEngine = new PerformanceEngine();

// 便捷的性能分析方法
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.debug(`⏱️ ${name} 執行時間: ${(end - start).toFixed(2)}ms`);
};

export const profileComponent = (componentName: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = function(...args: any[]) {
      performanceEngine.analyzeComponentPerformance(componentName);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
};