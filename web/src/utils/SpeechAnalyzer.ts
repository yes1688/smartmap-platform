// 深度分析 Chrome 語音識別的工具
export class SpeechAnalyzer {
  private originalFetch: typeof fetch;
  private originalXHR: typeof XMLHttpRequest;
  private networkLogs: Array<{
    method: string;
    url: string;
    timestamp: number;
    type: 'fetch' | 'xhr';
    headers?: any;
  }> = [];

  constructor() {
    this.originalFetch = window.fetch;
    this.originalXHR = window.XMLHttpRequest;
    this.hookNetworkRequests();
  }

  // 攔截所有網路請求
  private hookNetworkRequests() {
    // 攔截 fetch
    window.fetch = async (...args) => {
      const [url, options] = args;
      const method = options?.method || 'GET';

      this.logRequest({
        method,
        url: url.toString(),
        timestamp: Date.now(),
        type: 'fetch',
        headers: options?.headers
      });

      return this.originalFetch.apply(window, args);
    };

    // 攔截 XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL) {
      this._analyzer_method = method;
      this._analyzer_url = url.toString();
      return originalOpen.apply(this, arguments as any);
    };

    XMLHttpRequest.prototype.send = function() {
      if (this._analyzer_method && this._analyzer_url) {
        const analyzer = (window as any)._speechAnalyzer;
        if (analyzer) {
          analyzer.logRequest({
            method: this._analyzer_method,
            url: this._analyzer_url,
            timestamp: Date.now(),
            type: 'xhr'
          });
        }
      }
      return originalSend.apply(this, arguments);
    };

    (window as any)._speechAnalyzer = this;
  }

  private logRequest(request: any) {
    // 檢查是否是語音相關的請求
    const speechPatterns = [
      'speech',
      'voice',
      'audio',
      'googleapis',
      'google',
      'recognition',
      'tts',
      'stt'
    ];

    const isSpeechRelated = speechPatterns.some(pattern =>
      request.url.toLowerCase().includes(pattern)
    );

    if (isSpeechRelated) {
      console.log('🎤 語音相關網路請求:', request);
    }

    this.networkLogs.push(request);
  }

  // 開始監控
  startMonitoring() {
    console.log('🔍 開始深度監控網路請求...');
    this.networkLogs = [];
  }

  // 停止監控並分析結果
  stopMonitoring() {
    console.log('📊 網路請求分析結果:');
    console.log(`總請求數: ${this.networkLogs.length}`);

    const speechRequests = this.networkLogs.filter(req =>
      req.url.includes('speech') ||
      req.url.includes('voice') ||
      req.url.includes('googleapis')
    );

    console.log(`語音相關請求: ${speechRequests.length}`);

    if (speechRequests.length > 0) {
      console.log('🎯 發現語音服務請求:', speechRequests);
    }

    return {
      total: this.networkLogs.length,
      speechRelated: speechRequests,
      allRequests: this.networkLogs
    };
  }

  // 恢復原始網路函數
  restore() {
    window.fetch = this.originalFetch;
    // XMLHttpRequest 恢復較複雜，暫時省略
    console.log('🔄 網路監控已恢復');
  }
}

// 語音識別內部分析
export class SpeechRecognitionAnalyzer {
  private recognition: any;
  private events: Array<{
    type: string;
    timestamp: number;
    data: any;
  }> = [];

  constructor() {
    this.setupRecognition();
  }

  private setupRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.hookEvents();
    }
  }

  private hookEvents() {
    const eventTypes = [
      'start', 'end', 'result', 'error',
      'nomatch', 'soundstart', 'soundend',
      'speechstart', 'speechend', 'audiostart', 'audioend'
    ];

    eventTypes.forEach(eventType => {
      this.recognition[`on${eventType}`] = (event: any) => {
        this.logEvent(eventType, event);
      };
    });
  }

  private logEvent(type: string, event: any) {
    const eventData = {
      type,
      timestamp: Date.now(),
      data: this.extractEventData(event)
    };

    this.events.push(eventData);
    console.log(`🎙️ 語音事件 [${type}]:`, eventData);
  }

  private extractEventData(event: any) {
    if (event.results) {
      return {
        resultIndex: event.resultIndex,
        results: Array.from(event.results).map((result: any) => ({
          transcript: result[0]?.transcript,
          confidence: result[0]?.confidence,
          isFinal: result.isFinal
        }))
      };
    }

    if (event.error) {
      return { error: event.error };
    }

    return { type: event.type };
  }

  // 分析語音識別性能
  analyzePerformance() {
    const startEvent = this.events.find(e => e.type === 'start');
    const endEvent = this.events.find(e => e.type === 'end');

    if (startEvent && endEvent) {
      const duration = endEvent.timestamp - startEvent.timestamp;
      console.log(`⏱️ 識別總時長: ${duration}ms`);
    }

    const resultEvents = this.events.filter(e => e.type === 'result');
    console.log(`📝 識別事件數: ${resultEvents.length}`);

    return {
      duration: endEvent && startEvent ? endEvent.timestamp - startEvent.timestamp : 0,
      eventCount: this.events.length,
      resultCount: resultEvents.length,
      events: this.events
    };
  }

  start() {
    this.events = [];
    this.recognition?.start();
  }

  stop() {
    this.recognition?.stop();
    return this.analyzePerformance();
  }
}

// 瀏覽器能力檢測
export class BrowserCapabilityAnalyzer {
  static analyze() {
    const capabilities = {
      // Web Speech API 支援
      speechRecognition: {
        webkit: 'webkitSpeechRecognition' in window,
        standard: 'SpeechRecognition' in window,
        synthesis: 'speechSynthesis' in window
      },

      // 音頻支援
      audio: {
        mediaDevices: 'mediaDevices' in navigator,
        getUserMedia: 'getUserMedia' in navigator.mediaDevices,
        audioContext: 'AudioContext' in window || 'webkitAudioContext' in window
      },

      // 瀏覽器信息
      browser: {
        userAgent: navigator.userAgent,
        vendor: navigator.vendor,
        platform: navigator.platform,
        language: navigator.language,
        languages: navigator.languages
      },

      // 網路狀態
      network: {
        online: navigator.onLine,
        connection: (navigator as any).connection || (navigator as any).mozConnection,
        effectiveType: (navigator as any).connection?.effectiveType
      }
    };

    console.log('🔬 瀏覽器能力分析:', capabilities);
    return capabilities;
  }

  // 檢測語音服務提供商
  static detectSpeechProvider() {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('chrome')) {
      return 'Google (Chrome)';
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      return 'Apple (Safari)';
    } else if (userAgent.includes('firefox')) {
      return 'Mozilla (不支援 Web Speech API)';
    } else if (userAgent.includes('edge')) {
      return 'Microsoft Edge (基於 Chromium - Google)';
    }

    return '未知';
  }
}

// 實時網路監控工具
export class RealTimeNetworkMonitor {
  private observer: PerformanceObserver;
  private entries: PerformanceEntry[] = [];

  constructor() {
    this.observer = new PerformanceObserver((list) => {
      const newEntries = list.getEntries();
      this.entries.push(...newEntries);

      newEntries.forEach(entry => {
        if (entry.name.includes('speech') ||
            entry.name.includes('voice') ||
            entry.name.includes('googleapis')) {
          console.log('🌐 Performance 發現語音請求:', entry);
        }
      });
    });
  }

  start() {
    try {
      this.observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
      console.log('📊 Performance Observer 已啟動');
    } catch (error) {
      console.log('⚠️ Performance Observer 不支援:', error);
    }
  }

  stop() {
    this.observer.disconnect();
    return this.entries;
  }
}

// 導出便捷函數
export const startDeepAnalysis = () => {
  const speechAnalyzer = new SpeechAnalyzer();
  const networkMonitor = new RealTimeNetworkMonitor();
  const recognitionAnalyzer = new SpeechRecognitionAnalyzer();

  speechAnalyzer.startMonitoring();
  networkMonitor.start();

  console.log('🚀 深度分析已啟動！');
  console.log('🎤 請開始使用語音識別...');

  return {
    speechAnalyzer,
    networkMonitor,
    recognitionAnalyzer,
    stop: () => {
      const speechResults = speechAnalyzer.stopMonitoring();
      const networkEntries = networkMonitor.stop();
      const recognitionResults = recognitionAnalyzer.stop();

      return {
        speech: speechResults,
        network: networkEntries,
        recognition: recognitionResults,
        browserCapabilities: BrowserCapabilityAnalyzer.analyze(),
        speechProvider: BrowserCapabilityAnalyzer.detectSpeechProvider()
      };
    }
  };
};