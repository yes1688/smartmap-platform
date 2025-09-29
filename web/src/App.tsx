import { Component, onMount, createSignal, Show, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import Header from '@/components/Header';
import DeckGLMap from '@/components/DeckGLMap';
import GamePanel from '@/components/GamePanel';
import SmartVoiceOrb from '@/components/SmartVoiceOrb';
import SpeechEarVoiceOrb from '@/components/SpeechEarVoiceOrb';
import SmartSearch from '@/components/SmartSearch';
import SmartContextPanel from '@/components/SmartContextPanel';
import OneIntelligenceSystem from '@/components/OneIntelligenceSystem';
import HistoricalSitePanel from '@/components/HistoricalSitePanel';
import LoadingOverlay from '@/components/LoadingOverlay';
import { WelcomeModal } from '@/components/WelcomeModal';
import { gameActions } from '@/stores/gameStore';
import type { UIState, HistoricalSite } from '@/types';
import '@/styles/animations.css';

// 智能引擎導入
import { predictionEngine } from '@/services/PredictionEngine';
import { GestureEngine, GestureType } from '@/services/GestureEngine';
import { createPersonalizationEngine } from '@/services/PersonalizationEngine';
import { animationEngine, fadeIn, slideIn } from '@/services/AnimationEngine';
import { performanceEngine } from '@/services/PerformanceEngine';
import { systemMonitor } from '@/utils/IntelligentSystemMonitor';

const App: Component = () => {
  // UI state management - 革命性重構
  const [uiState, setUiState] = createStore<UIState>({
    isChatPanelOpen: false, // 暫時保留舊組件
    isGamePanelExpanded: true,
    isSiteInfoPanelOpen: false,
    isLoading: true,
    currentHistoricalSite: undefined,
  });

  // 新智能界面狀態
  const [isSearchOpen, setIsSearchOpen] = createSignal(false);
  const [contextPanel, setContextPanel] = createSignal<{
    isVisible: boolean;
    location?: any;
    position: { x: number; y: number };
  }>({ isVisible: false, position: { x: 0, y: 0 } });
  // ONE Intelligence System 狀態
  const [oneSystemEnabled, setOneSystemEnabled] = createSignal(true);

  const [userId] = createSignal(generateUserId());

  // 語音系統選擇狀態
  const [voiceSystem, setVoiceSystem] = createSignal<'chrome' | 'speechear'>('speechear'); // 預設使用您的 Speech Ear 系統

  // 歡迎彈窗狀態
  const [showWelcomeModal, setShowWelcomeModal] = createSignal(false);

  // 智能引擎實例
  let gestureEngine: GestureEngine | null = null;
  let personalizationEngine: any = null;

  onMount(async () => {
    // 每次頁面載入都顯示歡迎彈窗
    setShowWelcomeModal(true);

    try {
      // Initialize the game system
      await gameActions.initializeGame(userId());

      // 🧠 初始化智能引擎系統
      await initializeIntelligentSystems();

      setUiState('isLoading', false);
      console.log('🚀 Intelligent Spatial Platform initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      setUiState('isLoading', false);
    }
  });

  // 智能系統初始化
  const initializeIntelligentSystems = async () => {
    try {
      // 啟動性能監控
      performanceEngine.startMonitoring();

      // 初始化手勢引擎
      const mapContainer = document.getElementById('map-container');
      if (mapContainer) {
        gestureEngine = new GestureEngine(mapContainer);

        // 註冊自定義手勢事件
        window.addEventListener('gesture:quickMove', handleGestureQuickMove);
        window.addEventListener('gesture:showAI', () => setOneSystemEnabled(!oneSystemEnabled()));
        window.addEventListener('gesture:showNearby', handleShowSearch);
        window.addEventListener('gesture:hideUI', () => {
          setIsSearchOpen(false);
          setOneSystemEnabled(false);
          setContextPanel(prev => ({ ...prev, isVisible: false }));
        });
      }

      // 初始化個性化引擎
      personalizationEngine = createPersonalizationEngine(userId());

      // 開始預測引擎的上下文適應
      predictionEngine.preloadRelevantData();

      // 啟用智能動畫效果
      const appElement = document.querySelector('.min-h-screen');
      if (appElement) {
        await fadeIn(appElement as HTMLElement);
      }

      // 啟動系統全面監控
      systemMonitor.startComprehensiveMonitoring();

      // 輸出初始系統診斷報告
      setTimeout(() => {
        console.log('📊 初始系統診斷報告:\n' + systemMonitor.generateDiagnosticReport());
      }, 5000);

      console.log('🧠 所有智能系統初始化完成');
    } catch (error) {
      console.error('智能系統初始化失敗:', error);
    }
  };

  // 清理智能系統
  onCleanup(() => {
    if (gestureEngine) {
      gestureEngine.destroy();
    }
    performanceEngine.stopMonitoring();
    animationEngine.destroy();
    systemMonitor.destroy();

    window.removeEventListener('gesture:quickMove', handleGestureQuickMove);
    window.removeEventListener('gesture:showAI', () => setOneSystemEnabled(!oneSystemEnabled()));
    window.removeEventListener('gesture:showNearby', handleShowSearch);
    window.removeEventListener('gesture:hideUI', () => {});

    console.log('🧹 所有智能系統已清理完成');
  });

  // UI event handlers - 新智能界面

  const handleToggleChatPanel = () => {
    setUiState('isChatPanelOpen', !uiState.isChatPanelOpen);
  };

  // Header AI 助手按鈕觸發 ONE 系統
  const handleToggleOneSystem = () => {
    setOneSystemEnabled(!oneSystemEnabled());
  };

  const handleToggleGamePanel = () => {
    setUiState('isGamePanelExpanded', !uiState.isGamePanelExpanded);
  };

  // 智能搜索處理
  const handleShowSearch = () => {
    setIsSearchOpen(true);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
  };

  // 快速移動處理
  const handleQuickMove = async (location: string) => {
    console.log(`🚀 快速移動到: ${location}`);
    // 這裡會調用 AI 移動 API
    try {
      const response = await fetch('http://localhost:8081/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: userId(),
          message: `移動小貓咪到${location}`,
          context: '智慧空間快速移動'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.type === 'movement' && data.data?.success && data.data.newPosition) {
          gameActions.setPlayerPosition(
            data.data.newPosition.latitude,
            data.data.newPosition.longitude
          );
          console.log(`✅ 成功移動到 ${location}`);
        }
      }
    } catch (error) {
      console.error('快速移動失敗:', error);
    }
  };

  // 上下文面板處理
  const handleMapClick = (event: any) => {
    // 可以在這裡處理地圖點擊，顯示上下文面板
    const { x, y } = event;
    setContextPanel({
      isVisible: true,
      location: {
        name: '點擊位置',
        type: 'location',
        description: '這是一個地圖位置點'
      },
      position: { x, y }
    });
  };

  const handleCloseContextPanel = () => {
    setContextPanel(prev => ({ ...prev, isVisible: false }));
  };

  // 快捷鍵支持
  onMount(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K 或 Ctrl+K 開啟搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }

      // ESC 關閉所有面板
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setContextPanel(prev => ({ ...prev, isVisible: false }));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  const handleShowHistoricalSite = (site: HistoricalSite) => {
    setUiState('currentHistoricalSite', site);
    setUiState('isSiteInfoPanelOpen', true);
  };

  const handleCloseHistoricalSite = () => {
    setUiState('isSiteInfoPanelOpen', false);
    setUiState('currentHistoricalSite', undefined);
  };

  const handlePlayerMove = (latitude: number, longitude: number) => {
    gameActions.updatePlayerPosition(latitude, longitude);
  };

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
  };

  // 手勢快速移動處理
  const handleGestureQuickMove = (event: CustomEvent) => {
    const { position } = event.detail;
    console.log('🤲 手勢快速移動:', position);
    // 這裡可以實現基於手勢位置的智能移動
  };

  // ONE 系統與聊天面板同步
  const handleOneSystemChatSync = (message: string) => {
    console.log('💬 ONE 系統同步到聊天:', message);
    // 這裡可以將 ONE 系統的建議同步到聊天面板
    // 如果需要的話，可以觸發聊天面板的輸入
  };

  // ONE 系統觸發語音
  const handleOneSystemVoiceTrigger = () => {
    console.log('🎤 ONE 系統觸發語音輸入');
    // 這裡可以觸發語音球的錄音功能
  };

  // 處理語音指令
  const handleVoiceCommand = async (text: string) => {
    console.log('🎤 收到語音指令:', text);

    try {
      // 記錄到預測引擎
      predictionEngine.recordInteraction('voice_command', { command: text });

      // 傳送語音指令到 AI 聊天 API
      const response = await fetch('http://localhost:8081/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          playerId: userId(),
          context: 'voice_command'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🤖 AI 回應:', result);

      // 如果是移動指令，更新前端 gameStore
      if (result.type === 'movement' && result.data?.success) {
        console.log('🐰 兔子移動成功:', result.data.newPosition);

        // 記錄移動到個性化引擎
        if (personalizationEngine) {
          personalizationEngine.recordVisit(
            result.data.location || '未知位置',
            result.data.category || 'movement',
            5000, // 假設停留5秒
            1 // 成功移動給予正面評分
          );
        }

        // 更新前端 gameStore，觸發地圖更新
        if (result.data.newPosition?.latitude && result.data.newPosition?.longitude) {
          await gameActions.updatePlayerPosition(
            result.data.newPosition.latitude,
            result.data.newPosition.longitude
          );
          console.log('✅ 前端 gameStore 已更新，貓咪應該移動了');
        }
      }

    } catch (error) {
      console.error('❌ 語音指令處理失敗:', error);
    }
  };

  function generateUserId(): string {
    return 'user_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  return (
    <div class="min-h-screen bg-neutral-50 flex flex-col relative overflow-hidden animate-fade-in">
      {/* Modern Background System */}
      <div class="absolute inset-0 pointer-events-none">
        {/* Primary gradient background */}
        <div class="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30"></div>

        {/* Subtle geometric overlay */}
        <div
          class="absolute inset-0 opacity-[0.02]"
          style="background-image: radial-gradient(circle at 2px 2px, rgb(var(--color-neutral-400)) 1px, transparent 0); background-size: 40px 40px;"
        ></div>

        {/* Ambient light effects */}
        <div class="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/[0.05] rounded-full blur-3xl animate-pulse-subtle"></div>
        <div class="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-400/[0.05] rounded-full blur-3xl animate-pulse-subtle" style="animation-delay: 1s;"></div>

        {/* Noise texture overlay */}
        <div class="absolute inset-0 opacity-[0.015] bg-gradient-to-tr from-transparent via-neutral-500/10 to-transparent"></div>
      </div>

      {/* Header Navigation */}
      <Header
        onToggleChat={handleToggleOneSystem}
      />

      {/* Main Application Container */}
      <main class="flex-1 relative" style="height: calc(100vh - 65px);">
        {/* Primary Content Area */}
        <div class="relative w-full h-full" style="height: 100%;">
          {/* Map Interface */}
          <div id="map-container" class="absolute inset-0 w-full h-full" style="height: 100%;">
            <DeckGLMap
              onPlayerMove={handlePlayerMove}
              onHistoricalSiteClick={handleShowHistoricalSite}
            />
          </div>

          {/* Overlay panels and UI elements */}
          <div class="absolute inset-0 pointer-events-none">
            {/* Game Panel - Hidden as functionality is integrated into left panel */}
            {/* <div class="pointer-events-auto">
              <GamePanel
                isExpanded={uiState.isGamePanelExpanded}
                onToggle={handleToggleGamePanel}
              />
            </div> */}

            {/* 🚀 新智能界面系統 - 革命性重構 */}

            {/* 智能語音球 - 雙系統支援 */}
            <div class="pointer-events-auto">
              <Show when={voiceSystem() === 'chrome'}>
                <SmartVoiceOrb onMovementResponse={(data) => console.log('Chrome 語音移動完成:', data)} />
              </Show>
              <Show when={voiceSystem() === 'speechear'}>
                <SpeechEarVoiceOrb onMovementResponse={(data) => console.log('Speech Ear 語音移動完成:', data)} />
              </Show>
            </div>

            {/* 🚀 ONE Intelligence System - 革命性中央智能球 */}
            <div class="pointer-events-auto">
              <Show when={oneSystemEnabled()}>
                <OneIntelligenceSystem
                  onQuickMove={handleQuickMove}
                  onShowSearch={handleShowSearch}
                  onSyncWithChat={handleOneSystemChatSync}
                  onTriggerVoice={handleOneSystemVoiceTrigger}
                />
              </Show>
            </div>

            {/* Floating Action Button (Mobile) */}
            <div class="lg:hidden fixed bottom-6 right-6 z-40 pointer-events-auto">
              <button
                onClick={handleToggleGamePanel}
                class="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-xl flex items-center justify-center text-white animate-scale-in"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 🗑️ SmartBottomToolbar 已被 ONE Intelligence System 替代 */}

        {/* 智能搜索界面 */}
        <SmartSearch
          isOpen={isSearchOpen()}
          onClose={handleCloseSearch}
          onQuickMove={handleQuickMove}
        />

        {/* 智能上下文面板 */}
        <SmartContextPanel
          isVisible={contextPanel().isVisible}
          location={contextPanel().location}
          position={contextPanel().position}
          onClose={handleCloseContextPanel}
          onMoveTo={handleQuickMove}
          onGetInfo={(location) => console.log('獲取信息:', location)}
        />

        {/* Modal Panels - 保留舊組件作為備用 */}
        <div class="fixed inset-0 pointer-events-none z-50">
          {/* Chat Panel - 暫時隱藏，已被新智能系統替代 */}
          <Show when={false && uiState.isChatPanelOpen}>
            <div class="pointer-events-auto">
              {/* <ChatPanel
                onClose={() => setUiState('isChatPanelOpen', false)}
              /> */}
            </div>
          </Show>

          {/* Historical Site Panel */}
          <Show when={uiState.isSiteInfoPanelOpen && uiState.currentHistoricalSite}>
            <div class="pointer-events-auto">
              <HistoricalSitePanel
                site={uiState.currentHistoricalSite!}
                onClose={handleCloseHistoricalSite}
              />
            </div>
          </Show>
        </div>
      </main>

      {/* Global Loading Overlay */}
      <Show when={uiState.isLoading}>
        <div class="fixed inset-0 z-[100] pointer-events-auto">
          <LoadingOverlay message="載入智慧空間平台..." />
        </div>
      </Show>

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal()}
        onClose={handleCloseWelcomeModal}
      />

      {/* Status Bar (Mobile) */}
      <div class="lg:hidden fixed bottom-0 left-0 right-0 bg-glass border-t border-neutral-200/50 p-4 z-30">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-subtle"></div>
            <span class="text-body-sm text-primary font-medium">系統運行中</span>
          </div>
          <div class="flex items-center space-x-2">
            <button
              onClick={handleToggleChatPanel}
              class="btn-primary btn-icon"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;