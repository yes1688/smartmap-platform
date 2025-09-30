import { Component, createSignal, Show } from 'solid-js';

interface LocationInfo {
  name: string;
  type: string;
  description: string;
  rating?: number;
  distance?: string;
  tags?: string[];
}

interface SmartContextPanelProps {
  isVisible: boolean;
  location?: LocationInfo;
  position: { x: number; y: number };
  onClose: () => void;
  onMoveTo?: (location: string) => void;
  onGetInfo?: (location: string) => void;
}

export const SmartContextPanel: Component<SmartContextPanelProps> = (props) => {
  const [isExpanded, setIsExpanded] = createSignal(false);

  const handleMoveTo = () => {
    if (props.location) {
      props.onMoveTo?.(props.location.name);
    }
    props.onClose();
  };

  const handleGetInfo = () => {
    if (props.location) {
      props.onGetInfo?.(props.location.name);
    }
  };

  const getLocationTypeEmoji = (type: string): string => {
    const typeMap: Record<string, string> = {
      'landmark': '🏛️',
      'restaurant': '🍽️',
      'nightmarket': '🍜',
      'shopping': '🛍️',
      'nature': '🏞️',
      'cultural': '🎭',
      'temple': '🏮',
      'default': '📍'
    };
    return typeMap[type] || typeMap.default;
  };

  const getRatingStars = (rating: number): string => {
    const stars = Math.round(rating);
    return '⭐'.repeat(stars);
  };

  return (
    <Show when={props.isVisible && props.location}>
      {/* 背景遮罩 */}
      <div
        class="fixed inset-0 z-40"
        onClick={props.onClose}
      ></div>

      {/* 上下文面板 */}
      <div
        class="fixed z-50 animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{
          left: `${Math.min(props.position.x, window.innerWidth - 320)}px`,
          top: `${Math.max(props.position.y - 200, 20)}px`
        }}
      >
        <div
          class="w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden"
          style={{
            "background": "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))"
          }}
        >
          {/* 頭部信息 */}
          <div class="p-4 border-b border-gray-200/50">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center text-2xl">
                {getLocationTypeEmoji(props.location?.type || 'default')}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-lg text-gray-900 truncate">
                  {props.location?.name}
                </h3>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-sm text-gray-600 capitalize">
                    {props.location?.type}
                  </span>
                  {props.location?.rating && (
                    <>
                      <span class="text-gray-400">•</span>
                      <span class="text-sm text-amber-600">
                        {getRatingStars(props.location.rating)}
                      </span>
                    </>
                  )}
                  {props.location?.distance && (
                    <>
                      <span class="text-gray-400">•</span>
                      <span class="text-sm text-gray-600">
                        {props.location.distance}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={props.onClose}
                class="flex-shrink-0 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* 描述信息 */}
          {props.location?.description && (
            <div class="p-4 border-b border-gray-200/50">
              <p class={`text-gray-700 leading-relaxed ${
                isExpanded() ? '' : 'line-clamp-3'
              }`}>
                {props.location.description}
              </p>
              {props.location.description.length > 100 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded())}
                  class="text-emerald-600 text-sm mt-2 hover:text-emerald-700 transition-colors duration-200"
                >
                  {isExpanded() ? '收起' : '展開'}
                </button>
              )}
            </div>
          )}

          {/* 標籤 */}
          {props.location?.tags && props.location.tags.length > 0 && (
            <div class="p-4 border-b border-gray-200/50">
              <div class="flex flex-wrap gap-2">
                {props.location.tags.map(tag => (
                  <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 快速操作 */}
          <div class="p-4">
            <div class="grid grid-cols-2 gap-3">
              <button
                onClick={handleMoveTo}
                class="group flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
              >
                <svg class="w-4 h-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span class="font-medium">移動到這裡</span>
              </button>

              <button
                onClick={handleGetInfo}
                class="group flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 active:scale-95"
              >
                <svg class="w-4 h-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="font-medium">更多信息</span>
              </button>
            </div>
          </div>

          {/* 底部相關建議 */}
          <div class="bg-gray-50/50 p-4">
            <div class="text-xs text-gray-500 mb-2">附近推薦</div>
            <div class="flex gap-2">
              <button class="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs rounded-full border border-gray-200 transition-colors duration-200">
                🍜 附近美食
              </button>
              <button class="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs rounded-full border border-gray-200 transition-colors duration-200">
                🏛️ 文化景點
              </button>
            </div>
          </div>
        </div>

        {/* 指向箭頭 */}
        <div class="absolute top-4 -left-2 w-4 h-4 bg-white/95 border-l border-t border-white/50 transform rotate-45"></div>
      </div>
    </Show>
  );
};

export default SmartContextPanel;