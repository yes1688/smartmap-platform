// 更深層的網路分析工具
export class DeepNetworkAnalyzer {
  private originalSend: any;
  private originalOpen: any;
  private originalFetch: any;
  private performanceObserver: PerformanceObserver | null = null;
  private resourceTimingEntries: PerformanceEntry[] = [];

  constructor() {
    this.hookAllNetworkMethods();
    this.setupPerformanceMonitoring();
    this.setupServiceWorkerMonitoring();
  }

  // 攔截所有可能的網路方法
  private hookAllNetworkMethods() {
    // 1. 攔截 XMLHttpRequest
    this.originalOpen = XMLHttpRequest.prototype.open;
    this.originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL) {
      console.log('🌐 XHR Open:', { method, url: url.toString() });
      if (url.toString().includes('speech') || url.toString().includes('google')) {
        console.log('🎯 語音相關 XHR 請求!', { method, url });
      }
      return this.originalOpen.apply(this, arguments as any);
    };

    XMLHttpRequest.prototype.send = function() {
      console.log('📤 XHR Send:', this._analyzer_url || 'unknown');
      return this.originalSend.apply(this, arguments);
    };

    // 2. 攔截 fetch
    this.originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      const urlString = url.toString();

      // 只記錄語音相關的請求，忽略常規請求
      if (urlString.includes('speech') || urlString.includes('google') || urlString.includes('voice')) {
        console.log('🎯 語音相關 Fetch 請求!', { url: urlString, method: options?.method || 'GET' });
      }

      return this.originalFetch.apply(window, args);
    };

    // 3. 攔截 navigator.sendBeacon
    if ('sendBeacon' in navigator) {
      const originalSendBeacon = navigator.sendBeacon;
      navigator.sendBeacon = function(url: string | URL, data?: any) {
        console.log('📡 SendBeacon:', { url: url.toString(), data });
        if (url.toString().includes('speech') || url.toString().includes('google')) {
          console.log('🎯 語音相關 Beacon 請求!', { url, data });
        }
        return originalSendBeacon.call(this, url, data);
      };
    }
  }

  // 設置 Performance API 監控
  private setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          this.resourceTimingEntries.push(entry);

          // 檢查語音相關請求
          if (entry.name.includes('speech') ||
              entry.name.includes('google') ||
              entry.name.includes('apis') ||
              entry.name.includes('voice')) {
            console.log('🎯 Performance API 發現語音請求:', entry);
          }

          // 檢查可疑的域名
          const suspiciousDomains = [
            'googleapis.com',
            'google.com',
            'speech',
            'voice',
            'audio'
          ];

          if (suspiciousDomains.some(domain => entry.name.includes(domain))) {
            console.log('🕵️ 可疑的語音相關資源:', {
              name: entry.name,
              entryType: entry.entryType,
              startTime: entry.startTime,
              duration: entry.duration
            });
          }
        });
      });

      try {
        this.performanceObserver.observe({
          entryTypes: ['resource', 'navigation', 'measure', 'mark']
        });
        console.log('✅ Performance Observer 已啟動');
      } catch (error) {
        console.warn('⚠️ Performance Observer 設置失敗:', error);
      }
    }
  }

  // 監控 Service Worker
  private setupServiceWorkerMonitoring() {
    if ('serviceWorker' in navigator) {
      console.log('🔍 檢查 Service Worker...');

      navigator.serviceWorker.getRegistrations().then(registrations => {
        if (registrations.length > 0) {
          console.log('📱 發現 Service Worker:', registrations);
          registrations.forEach(registration => {
            console.log('SW 範圍:', registration.scope);
          });
        }
      });
    }
  }

  // 使用 Resource Timing API 深度分析
  public analyzeResourceTiming() {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    const suspiciousEntries = entries.filter(entry => {
      return entry.name.includes('speech') ||
             entry.name.includes('google') ||
             entry.name.includes('voice') ||
             entry.name.includes('audio') ||
             entry.name.includes('apis');
    });

    // 只在找到可疑資源時才打印日誌
    if (suspiciousEntries.length > 0) {
      console.log('🎯 發現語音相關資源:', suspiciousEntries.length, '個');
      suspiciousEntries.forEach(entry => {
        console.log('📝 資源詳情:', {
          name: entry.name,
          initiatorType: entry.initiatorType,
          transferSize: entry.transferSize,
          duration: entry.duration
        });
      });
    }

    return suspiciousEntries;
  }

  // 檢查瀏覽器內部進程
  public checkBrowserInternals() {
    console.log('🔬 瀏覽器內部檢查:');

    // 檢查 Chrome 特有的 API
    if ('chrome' in window) {
      console.log('🔍 Chrome 擴展 API 可用');
      const chromeObj = (window as any).chrome;

      // 檢查可能的內部 API
      const apis = [
        'runtime', 'tabs', 'storage', 'webRequest',
        'declarativeNetRequest', 'proxy'
      ];

      apis.forEach(api => {
        if (api in chromeObj) {
          console.log(`✅ Chrome.${api} 可用`);
        }
      });
    }

    // 檢查 WebRTC 連接（語音可能通過此傳輸）
    if ('RTCPeerConnection' in window) {
      console.log('🔗 WebRTC 可用，語音可能通過 P2P 連接');
    }

    // 檢查 Media Stream API
    if ('mediaDevices' in navigator) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const audioDevices = devices.filter(device => device.kind.includes('audio'));
        console.log('🎤 音頻設備:', audioDevices.map(d => ({
          kind: d.kind,
          label: d.label
        })));
      });
    }
  }

  // 嘗試捕捉 WebSocket 連接
  public monitorWebSockets() {
    const originalWebSocket = window.WebSocket;

    window.WebSocket = class extends WebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        console.log('🔌 WebSocket 連接:', { url: url.toString(), protocols });

        if (url.toString().includes('speech') ||
            url.toString().includes('google') ||
            url.toString().includes('voice')) {
          console.log('🎯 語音相關 WebSocket!', url);
        }

        super(url, protocols);

        this.addEventListener('open', () => {
          console.log('✅ WebSocket 已開啟:', url);
        });

        this.addEventListener('message', (event) => {
          console.log('📩 WebSocket 訊息:', { url, data: event.data });
        });
      }
    };
  }

  // 檢查是否有隱藏的 iframe
  public checkHiddenFrames() {
    const iframes = document.querySelectorAll('iframe');
    console.log('🖼️ 檢查 iframe:', iframes.length, '個');

    iframes.forEach((iframe, index) => {
      console.log(`iframe ${index}:`, {
        src: iframe.src,
        style: iframe.style.cssText,
        hidden: iframe.hidden || iframe.style.display === 'none'
      });

      if (iframe.src.includes('speech') || iframe.src.includes('google')) {
        console.log('🎯 發現語音相關 iframe!', iframe);
      }
    });
  }

  // 監控 DOM 變化（可能動態創建請求元素）
  public monitorDOMChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;

              // 檢查新增的 script、iframe、link 等
              if (['SCRIPT', 'IFRAME', 'LINK'].includes(element.tagName)) {
                const src = element.getAttribute('src') || element.getAttribute('href');
                if (src && (src.includes('speech') || src.includes('google'))) {
                  console.log('🎯 動態創建的語音相關元素:', element);
                }
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('👁️ DOM 變化監控已啟動');
  }

  // 全面啟動深度監控
  public startDeepMonitoring() {
    console.log('🚀 啟動全面深度網路監控...');

    this.monitorWebSockets();
    this.checkHiddenFrames();
    this.monitorDOMChanges();
    this.checkBrowserInternals();

    // 定期檢查資源
    setInterval(() => {
      this.analyzeResourceTiming();
    }, 5000);

    console.log('🕵️ 深度監控已全面啟動！');
  }

  // 生成最終報告
  public generateReport() {
    return {
      resourceEntries: this.resourceTimingEntries,
      suspiciousResources: this.analyzeResourceTiming(),
      timestamp: new Date().toISOString()
    };
  }
}

// 導出便捷函數
export const startUltimateAnalysis = () => {
  const analyzer = new DeepNetworkAnalyzer();
  analyzer.startDeepMonitoring();
  return analyzer;
};