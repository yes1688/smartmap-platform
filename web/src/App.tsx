import { Component, onMount, createSignal, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import Header from '@/components/Header';
import DeckGLMap from '@/components/DeckGLMap';
import GamePanel from '@/components/GamePanel';
import ChatPanel from '@/components/ChatPanel';
import VoicePanel from '@/components/VoicePanel';
import VoiceControl from '@/components/VoiceControl';
import HistoricalSitePanel from '@/components/HistoricalSitePanel';
import LoadingOverlay from '@/components/LoadingOverlay';
import { WelcomeModal } from '@/components/WelcomeModal';
import { gameActions } from '@/stores/gameStore';
import type { UIState, HistoricalSite } from '@/types';
import '@/styles/animations.css';

const App: Component = () => {
  // UI state management
  const [uiState, setUiState] = createStore<UIState>({
    isVoicePanelOpen: false,
    isChatPanelOpen: false,
    isGamePanelExpanded: true,
    isSiteInfoPanelOpen: false,
    isLoading: true,
    currentHistoricalSite: undefined,
  });

  const [userId] = createSignal(generateUserId());

  // 歡迎彈窗狀態
  const [showWelcomeModal, setShowWelcomeModal] = createSignal(false);

  onMount(async () => {
    // 每次頁面載入都顯示歡迎彈窗
    setShowWelcomeModal(true);
    try {
      // Initialize the game system
      await gameActions.initializeGame(userId());

      setUiState('isLoading', false);
      console.log('🚀 Intelligent Spatial Platform initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      setUiState('isLoading', false);
    }
  });

  // UI event handlers
  const handleToggleVoicePanel = () => {
    setUiState('isVoicePanelOpen', !uiState.isVoicePanelOpen);
  };

  const handleToggleChatPanel = () => {
    setUiState('isChatPanelOpen', !uiState.isChatPanelOpen);
  };

  const handleToggleGamePanel = () => {
    setUiState('isGamePanelExpanded', !uiState.isGamePanelExpanded);
  };

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

  // 處理語音指令
  const handleVoiceCommand = async (text: string) => {
    console.log('🎤 收到語音指令:', text);

    try {
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

      // 如果是移動指令，會自動執行移動
      if (result.type === 'movement' && result.data?.success) {
        console.log('🐰 兔子移動成功:', result.data.newPosition);
        // 地圖會自動跟隨，因為 DeckGLMap 監聽 gameStore 變化
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
        onToggleVoice={handleToggleVoicePanel}
        onToggleChat={handleToggleChatPanel}
      />

      {/* Main Application Container */}
      <main class="flex-1 relative" style="height: calc(100vh - 65px);">
        {/* Primary Content Area */}
        <div class="relative w-full h-full" style="height: 100%;">
          {/* Map Interface */}
          <div class="absolute inset-0 w-full h-full" style="height: 100%;">
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

            {/* 語音控制組件 */}
            <div class="pointer-events-auto">
              <VoiceControl onVoiceCommand={handleVoiceCommand} />
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

        {/* Modal Panels */}
        <div class="fixed inset-0 pointer-events-none z-50">
          {/* Chat Panel */}
          <Show when={uiState.isChatPanelOpen}>
            <div class="pointer-events-auto">
              <ChatPanel
                onClose={() => setUiState('isChatPanelOpen', false)}
              />
            </div>
          </Show>

          {/* Voice Panel */}
          <Show when={uiState.isVoicePanelOpen}>
            <div class="pointer-events-auto">
              <VoicePanel
                onClose={() => setUiState('isVoicePanelOpen', false)}
              />
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
              onClick={handleToggleVoicePanel}
              class="btn-ghost flex items-center space-x-1 px-2 py-1"
            >
              <div class="relative">
                {/* 暈光背景 - 呼吸效果 */}
                <div class="absolute inset-0 bg-red-500/20 rounded-full blur-sm animate-pulse"></div>
                {/* 外層暈光 */}
                <div class="absolute inset-0 bg-red-500/10 rounded-full blur-md animate-pulse" style="animation-delay: 0.5s;"></div>
                {/* 麥克風圖示 */}
                <svg class="w-4 h-4 text-red-500 relative z-10 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span class="text-xs font-medium">AI</span>
            </button>
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