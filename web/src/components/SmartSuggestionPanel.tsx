import { Component, createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import { predictionEngine, SuggestedAction } from '@/services/PredictionEngine';

interface SmartSuggestionPanelProps {
  isVisible: boolean;
  onActionSelect?: (action: SuggestedAction) => void;
  onDismiss?: () => void;
}

export const SmartSuggestionPanel: Component<SmartSuggestionPanelProps> = (props) => {
  const [suggestions, setSuggestions] = createSignal<SuggestedAction[]>([]);
  const [currentContext, setCurrentContext] = createSignal<any>(null);
  const [isExpanded, setIsExpanded] = createSignal(false);

  let updateInterval: number;

  onMount(() => {
    updateSuggestions();

    // 每30秒更新一次建議
    updateInterval = window.setInterval(() => {
      updateSuggestions();
    }, 30000);

    onCleanup(() => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    });
  });

  const updateSuggestions = () => {
    const context = predictionEngine.adaptToContext();
    setCurrentContext(context);
    setSuggestions(context.suggestedActions || []);
  };

  const handleActionClick = (action: SuggestedAction) => {
    action.action();
    props.onActionSelect?.(action);

    // 記錄用戶交互
    predictionEngine.recordInteraction('suggestion_used', {
      actionId: action.id,
      actionType: action.type
    });
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '早安';
    if (hour >= 12 && hour < 18) return '午安';
    if (hour >= 18 && hour < 22) return '晚安';
    return '夜深了';
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return 'from-emerald-500 to-teal-600';
    if (priority <= 4) return 'from-blue-500 to-indigo-600';
    return 'from-purple-500 to-pink-600';
  };

  return (
    <Show when={props.isVisible}>
      <div class="fixed top-20 right-6 z-30 max-w-sm">
        <div
          class="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300"
          style={{
            "background": "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))"
          }}
        >
          {/* 標題區域 */}
          <div class="p-4 border-b border-gray-200/50">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                  <span class="text-white text-lg">🧠</span>
                </div>
                <div>
                  <h3 class="font-bold text-gray-900">{getTimeGreeting()}！智能建議</h3>
                  <p class="text-xs text-gray-500">
                    {currentContext()?.timeContext?.period} •
                    信心度 {Math.round((currentContext()?.confidence || 0) * 100)}%
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded())}
                  class="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
                >
                  <svg
                    class={`w-4 h-4 text-gray-600 transition-transform duration-300 ${isExpanded() ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                <button
                  onClick={props.onDismiss}
                  class="w-8 h-8 bg-gray-100 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors duration-200"
                >
                  <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* 建議列表 */}
          <div class={`transition-all duration-300 ${isExpanded() ? 'max-h-96' : 'max-h-48'} overflow-y-auto`}>
            <For each={suggestions().slice(0, isExpanded() ? 8 : 4)}>
              {(action, index) => (
                <button
                  onClick={() => handleActionClick(action)}
                  class="w-full p-4 text-left hover:bg-gray-50/50 transition-colors duration-200 border-b border-gray-100/50 last:border-b-0 group"
                >
                  <div class="flex items-start gap-3">
                    {/* 動作圖標 */}
                    <div class={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${getPriorityColor(action.priority)} rounded-lg flex items-center justify-center text-white text-lg transition-transform duration-300 group-hover:scale-110`}>
                      {action.emoji}
                    </div>

                    {/* 動作內容 */}
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <h4 class="font-semibold text-gray-900 text-sm truncate">
                          {action.title}
                        </h4>
                        <div class={`px-2 py-0.5 rounded-full text-xs ${
                          action.type === 'time_based' ? 'bg-amber-100 text-amber-700' :
                          action.type === 'contextual' ? 'bg-blue-100 text-blue-700' :
                          action.type === 'quick_move' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {action.type === 'time_based' ? '時間' :
                           action.type === 'contextual' ? '上下文' :
                           action.type === 'quick_move' ? '快速' : '探索'}
                        </div>
                      </div>
                      <p class="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {action.description}
                      </p>

                      {/* 相關性評分 */}
                      <div class="flex items-center gap-2 mt-2">
                        <div class="flex-1 bg-gray-200 rounded-full h-1">
                          <div
                            class="bg-gradient-to-r from-emerald-400 to-teal-500 h-1 rounded-full transition-all duration-500"
                            style={{ width: `${action.relevanceScore * 100}%` }}
                          ></div>
                        </div>
                        <span class="text-xs text-gray-500 font-medium">
                          {Math.round(action.relevanceScore * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* 箭頭指示器 */}
                    <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </div>
                </button>
              )}
            </For>

            {/* 無建議狀態 */}
            <Show when={suggestions().length === 0}>
              <div class="p-6 text-center text-gray-500">
                <div class="text-3xl mb-2">🤔</div>
                <div class="text-sm">正在分析您的偏好...</div>
                <div class="text-xs mt-1">稍後會有更精準的建議</div>
              </div>
            </Show>
          </div>

          {/* 底部狀態 */}
          <div class="p-3 bg-gray-50/50 border-t border-gray-200/50">
            <div class="flex items-center justify-between text-xs text-gray-500">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>AI 持續學習中</span>
              </div>
              <button
                onClick={updateSuggestions}
                class="flex items-center gap-1 hover:text-emerald-600 transition-colors duration-200"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                <span>刷新</span>
              </button>
            </div>
          </div>
        </div>

        {/* 浮動提示氣泡 */}
        <Show when={!isExpanded() && suggestions().length > 4}>
          <div class="absolute -bottom-2 right-4 bg-amber-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
            +{suggestions().length - 4} 更多建議
          </div>
        </Show>
      </div>
    </Show>
  );
};

export default SmartSuggestionPanel;