import { Component, createSignal, onMount, onCleanup, For, Show, createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';
import { CONFIG } from '@/config';
import { gameStore, gameActions } from '@/stores/gameStore';
import { predictionEngine, SuggestedAction } from '@/services/PredictionEngine';

// 🍎 Apple Neural Engine 靈感的智能狀態系統
enum IntelligenceState {
  AMBIENT = 'ambient',     // 環境感知 - 最小存在感
  ACTIVE = 'active',       // 主動建議 - 替代右側面板
  EXECUTING = 'executing'  // 快速操作 - 替代底部工具列
}

interface OneSystemState {
  currentState: IntelligenceState;
  isAnimating: boolean;
  suggestions: SuggestedAction[];
  quickActions: QuickAction[];
  contextualHints: ContextualHint[];
  voiceText: string;
  isListening: boolean;
  isProcessing: boolean;
}

interface QuickAction {
  id: string;
  emoji: string;
  label: string;
  category: 'move' | 'explore' | 'info' | 'settings';
  action: () => void;
  priority: number;
}

interface ContextualHint {
  id: string;
  text: string;
  type: 'time' | 'location' | 'weather' | 'preference';
  relevance: number;
}

interface OneIntelligenceSystemProps {
  onQuickMove?: (location: string) => void;
  onShowSearch?: () => void;
  onSyncWithChat?: (message: string) => void;
  onTriggerVoice?: () => void;
}

export const OneIntelligenceSystem: Component<OneIntelligenceSystemProps> = (props) => {
  // 🧠 核心狀態管理
  const [state, setState] = createStore<OneSystemState>({
    currentState: IntelligenceState.AMBIENT,
    isAnimating: false,
    suggestions: [],
    quickActions: [],
    contextualHints: [],
    voiceText: '',
    isListening: false,
    isProcessing: false
  });

  let updateInterval: number;
  let animationFrame: number;

  // 🌟 初始化智能系統
  onMount(() => {
    console.log('🚀 ONE Intelligence System 正在啟動...');

    // 初始化智能建議
    updateIntelligentSuggestions();

    // 生成快速操作
    generateQuickActions();

    // 定期更新上下文
    updateInterval = window.setInterval(() => {
      updateContextualHints();
      updateIntelligentSuggestions();
    }, 30000);

    // 鍵盤快捷鍵
    setupKeyboardShortcuts();

    console.log('✅ ONE Intelligence System 已啟動');

    onCleanup(() => {
      if (updateInterval) clearInterval(updateInterval);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    });
  });

  // 🎯 智能建議更新 (替代 SmartSuggestionPanel)
  const updateIntelligentSuggestions = () => {
    const context = predictionEngine.adaptToContext();
    setState('suggestions', context.suggestedActions || []);
  };

  // ⚡ 生成快速操作 (替代 SmartBottomToolbar)
  const generateQuickActions = () => {
    const hour = new Date().getHours();

    const actions: QuickAction[] = [
      {
        id: 'quick-move',
        emoji: '⚡',
        label: '快速移動',
        category: 'move',
        priority: 1,
        action: () => handleQuickMoveAction()
      },
      {
        id: 'explore-food',
        emoji: '🍜',
        label: '美食探索',
        category: 'explore',
        priority: 2,
        action: () => handleCategoryExplore('food')
      },
      {
        id: 'explore-culture',
        emoji: '🏛️',
        label: '文化景點',
        category: 'explore',
        priority: 3,
        action: () => handleCategoryExplore('culture')
      },
      {
        id: 'explore-nature',
        emoji: '🏞️',
        label: '自然風光',
        category: 'explore',
        priority: 4,
        action: () => handleCategoryExplore('nature')
      },
      {
        id: 'time-recommendation',
        emoji: hour >= 18 ? '🌃' : hour >= 12 ? '☀️' : '🌅',
        label: '時間推薦',
        category: 'info',
        priority: 5,
        action: () => handleTimeBasedRecommendation()
      },
      {
        id: 'search',
        emoji: '🔍',
        label: '智能搜索',
        category: 'info',
        priority: 6,
        action: () => props.onShowSearch?.()
      }
    ];

    setState('quickActions', actions);
  };

  // 🌍 更新上下文提示
  const updateContextualHints = () => {
    const hour = new Date().getHours();
    const player = gameStore.currentPlayer;

    const hints: ContextualHint[] = [];

    // 時間相關提示
    if (hour >= 6 && hour < 10) {
      hints.push({
        id: 'morning',
        text: '🌅 早晨適合登山觀日出',
        type: 'time',
        relevance: 0.8
      });
    } else if (hour >= 18 && hour < 22) {
      hints.push({
        id: 'evening',
        text: '🌃 夜晚正是夜市美食時光',
        type: 'time',
        relevance: 0.9
      });
    }

    // 位置相關提示
    if (player) {
      hints.push({
        id: 'location',
        text: `📍 當前位置: ${player.latitude.toFixed(4)}°, ${player.longitude.toFixed(4)}°`,
        type: 'location',
        relevance: 0.7
      });
    }

    setState('contextualHints', hints);
  };

  // 🎨 狀態切換動畫
  const transitionToState = async (newState: IntelligenceState) => {
    if (state.currentState === newState || state.isAnimating) return;

    setState('isAnimating', true);

    // Apple 風格的動畫過渡
    await new Promise(resolve => {
      animationFrame = requestAnimationFrame(() => {
        setState('currentState', newState);
        setTimeout(resolve, 600); // 0.6s Apple 動畫時長
      });
    });

    setState('isAnimating', false);
  };

  // 🎯 事件處理器

  const handleOrbClick = () => {
    if (state.currentState === IntelligenceState.AMBIENT) {
      transitionToState(IntelligenceState.ACTIVE);
    } else {
      transitionToState(IntelligenceState.AMBIENT);
    }
  };

  const handleQuickMoveAction = () => {
    transitionToState(IntelligenceState.EXECUTING);
    // 顯示快速移動選項
    const popularLocations = ['台北101', '總統府', '士林夜市', '淡水老街'];
    // 這裡可以觸發快速選擇界面
    props.onQuickMove?.(popularLocations[0]);
  };

  const handleCategoryExplore = (category: string) => {
    const categoryLocations: Record<string, string[]> = {
      food: ['士林夜市', '寧夏夜市', '逢甲夜市'],
      culture: ['總統府', '中正紀念堂', '龍山寺'],
      nature: ['陽明山', '日月潭', '阿里山']
    };

    const locations = categoryLocations[category] || [];
    if (locations.length > 0) {
      props.onQuickMove?.(locations[0]);
    }
  };

  const handleTimeBasedRecommendation = () => {
    const hour = new Date().getHours();
    let recommendation = '';

    if (hour >= 6 && hour < 10) {
      recommendation = '移動到陽明山看日出';
    } else if (hour >= 18 && hour < 22) {
      recommendation = '移動到士林夜市品嚐美食';
    } else {
      recommendation = '移動到台北101欣賞夜景';
    }

    props.onSyncWithChat?.(recommendation);
    props.onQuickMove?.(recommendation.replace('移動到', ''));
  };

  const handleSuggestionClick = (suggestion: SuggestedAction) => {
    suggestion.action();
    predictionEngine.recordInteraction('suggestion_used', {
      actionId: suggestion.id,
      actionType: suggestion.type
    });

    // 執行後回到 AMBIENT 狀態
    setTimeout(() => {
      transitionToState(IntelligenceState.AMBIENT);
    }, 1500);
  };

  // ⌨️ 鍵盤快捷鍵
  const setupKeyboardShortcuts = () => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Option + Space 或 Alt + Space 激活 ONE 系統
      if ((e.altKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        handleOrbClick();
      }

      // ESC 返回 AMBIENT 狀態
      if (e.key === 'Escape' && state.currentState !== IntelligenceState.AMBIENT) {
        transitionToState(IntelligenceState.AMBIENT);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  };

  // 🎨 動態樣式計算
  const getOrbStyle = () => {
    const baseStyle = {
      position: 'fixed' as const,
      left: '50%',
      transform: 'translateX(-50%)',
      'z-index': 100,
      transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      cursor: 'pointer'
    };

    switch (state.currentState) {
      case IntelligenceState.AMBIENT:
        return {
          ...baseStyle,
          bottom: '80px',
          width: '48px',
          height: '48px'
        };

      case IntelligenceState.ACTIVE:
        return {
          ...baseStyle,
          bottom: '120px',
          width: '360px',
          height: 'auto',
          'max-height': '500px'
        };

      case IntelligenceState.EXECUTING:
        return {
          ...baseStyle,
          bottom: '40px',
          width: '80%',
          'max-width': '600px',
          height: '80px'
        };

      default:
        return baseStyle;
    }
  };

  return (
    <div
      class="one-intelligence-system"
      style={getOrbStyle()}
      onClick={handleOrbClick}
    >
      {/* 🌟 AMBIENT STATE - 環境感知模式 */}
      <Show when={state.currentState === IntelligenceState.AMBIENT}>
        <div class="one-ambient-orb group">
          {/* 主要智能球 */}
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group-hover:scale-110">
            {/* 核心圖標 */}
            <div class="relative">
              <div class="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                <span class="text-white text-xs">✨</span>
              </div>
              {/* 呼吸燈效果 */}
              <div class="absolute inset-0 bg-emerald-400/30 rounded-full animate-ping"></div>
            </div>
          </div>

          {/* 上下文提示氣泡 */}
          <Show when={state.contextualHints.length > 0}>
            <div class="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div class="bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs whitespace-nowrap">
                {state.contextualHints[0]?.text}
              </div>
            </div>
          </Show>

          {/* 操作提示 */}
          <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div class="text-xs text-gray-600 whitespace-nowrap">
              點擊展開 · ⌥Space
            </div>
          </div>
        </div>
      </Show>

      {/* 🔥 ACTIVE STATE - 智能建議模式 (替代右側面板) */}
      <Show when={state.currentState === IntelligenceState.ACTIVE}>
        <div class="one-active-panel bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
          {/* 標題區域 */}
          <div class="p-4 border-b border-gray-200/50 bg-gradient-to-r from-emerald-50/80 to-teal-50/80">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                  <span class="text-white text-lg">🧠</span>
                </div>
                <div>
                  <h3 class="font-bold text-gray-900">智能建議</h3>
                  <p class="text-xs text-gray-500">
                    {new Date().getHours() < 12 ? '早安' : new Date().getHours() < 18 ? '午安' : '晚安'}！為您推薦
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  transitionToState(IntelligenceState.AMBIENT);
                }}
                class="w-8 h-8 bg-gray-100 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* 建議列表 */}
          <div class="max-h-80 overflow-y-auto">
            <For each={state.suggestions.slice(0, 6)}>
              {(suggestion, index) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSuggestionClick(suggestion);
                  }}
                  class="w-full p-4 text-left hover:bg-gray-50/50 transition-colors duration-200 border-b border-gray-100/50 last:border-b-0 group"
                >
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-lg transition-transform duration-300 group-hover:scale-110">
                      {suggestion.emoji}
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <h4 class="font-semibold text-gray-900 text-sm truncate">
                          {suggestion.title}
                        </h4>
                        <div class="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">
                          AI推薦
                        </div>
                      </div>
                      <p class="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {suggestion.description}
                      </p>

                      {/* 相關性評分 */}
                      <div class="flex items-center gap-2 mt-2">
                        <div class="flex-1 bg-gray-200 rounded-full h-1">
                          <div
                            class="bg-gradient-to-r from-emerald-400 to-teal-500 h-1 rounded-full transition-all duration-500"
                            style={{ width: `${suggestion.relevanceScore * 100}%` }}
                          ></div>
                        </div>
                        <span class="text-xs text-gray-500 font-medium">
                          {Math.round(suggestion.relevanceScore * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              )}
            </For>

            {/* 無建議狀態 */}
            <Show when={state.suggestions.length === 0}>
              <div class="p-6 text-center text-gray-500">
                <div class="text-3xl mb-2">🤔</div>
                <div class="text-sm">正在分析您的偏好...</div>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      {/* ⚡ EXECUTING STATE - 快速操作模式 (替代底部工具列) */}
      <Show when={state.currentState === IntelligenceState.EXECUTING}>
        <div class="one-executing-toolbar bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          <div class="p-3">
            <div class="flex items-center justify-center gap-2">
              <For each={state.quickActions}>
                {(action) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      action.action();
                    }}
                    class="group relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 hover:bg-white/20"
                  >
                    <span class="text-xl">{action.emoji}</span>

                    {/* 工具提示 */}
                    <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      {action.label}
                    </div>
                  </button>
                )}
              </For>
            </div>
          </div>
        </div>
      </Show>

      {/* 全局樣式 */}
      <style>{`
        .one-intelligence-system {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .one-ambient-orb {
          position: relative;
        }

        .one-active-panel {
          animation: expandFromCenter 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .one-executing-toolbar {
          animation: slideUpFromBottom 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes expandFromCenter {
          from {
            transform: translateX(-50%) scale(0.8);
            opacity: 0.8;
          }
          to {
            transform: translateX(-50%) scale(1.0);
            opacity: 1.0;
          }
        }

        @keyframes slideUpFromBottom {
          from {
            transform: translateX(-50%) translateY(20px);
            opacity: 0.8;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1.0;
          }
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default OneIntelligenceSystem;