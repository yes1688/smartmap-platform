import { Component, createSignal, For } from 'solid-js';
import { gameStore } from '@/stores/gameStore';

interface ToolAction {
  id: string;
  emoji: string;
  label: string;
  action: () => void;
  shortcuts?: string[];
  badge?: string;
  priority: number;
}

interface SmartBottomToolbarProps {
  onQuickMove?: (location: string) => void;
  onShowSearch?: () => void;
  currentVoiceSystem?: 'chrome' | 'speechear';
  onToggleVoiceSystem?: () => void;
}

export const SmartBottomToolbar: Component<SmartBottomToolbarProps> = (props) => {
  const [activeAction, setActiveAction] = createSignal<string | null>(null);

  // 核心工具配置
  const getCoreTools = (): ToolAction[] => {
    const hour = new Date().getHours();

    return [
      {
        id: 'quick-move',
        emoji: '⚡',
        label: '快速移動',
        priority: 1,
        action: () => handleQuickMove(),
        shortcuts: ['台北101', '總統府', '士林夜市']
      },
      {
        id: 'food',
        emoji: '🍜',
        label: '美食',
        priority: 2,
        action: () => handleCategoryAction('food'),
        shortcuts: ['夜市', '小吃', '餐廳']
      },
      {
        id: 'culture',
        emoji: '🏛️',
        label: '文化',
        priority: 3,
        action: () => handleCategoryAction('culture'),
        shortcuts: ['古蹟', '廟宇', '博物館']
      },
      {
        id: 'nature',
        emoji: '🏞️',
        label: '自然',
        priority: 4,
        action: () => handleCategoryAction('nature'),
        shortcuts: ['山川', '湖泊', '公園']
      },
      {
        id: 'shopping',
        emoji: '🛍️',
        label: '購物',
        priority: 5,
        action: () => handleCategoryAction('shopping'),
        shortcuts: ['商圈', '百貨', '市集']
      },
      {
        id: 'time-suggestion',
        emoji: hour >= 18 ? '🌃' : hour >= 12 ? '☀️' : '🌅',
        label: '時間推薦',
        priority: 6,
        action: () => handleTimeBasedSuggestion(),
        badge: getTimeLabel(hour)
      },
      {
        id: 'location',
        emoji: '📍',
        label: '位置',
        priority: 7,
        action: () => handleLocationInfo()
      },
      {
        id: 'search',
        emoji: '🔍',
        label: '搜尋',
        priority: 8,
        action: () => props.onShowSearch?.()
      },
      {
        id: 'voice-system',
        emoji: props.currentVoiceSystem === 'speechear' ? '🏠' : '🌐',
        label: props.currentVoiceSystem === 'speechear' ? 'Speech Ear' : 'Chrome 語音',
        priority: 9,
        action: () => props.onToggleVoiceSystem?.(),
        badge: props.currentVoiceSystem === 'speechear' ? '自主' : 'Google'
      }
    ];
  };

  const getTimeLabel = (hour: number): string => {
    if (hour >= 6 && hour < 10) return '早晨';
    if (hour >= 10 && hour < 14) return '上午';
    if (hour >= 14 && hour < 18) return '下午';
    if (hour >= 18 && hour < 22) return '傍晚';
    return '深夜';
  };

  const handleQuickMove = () => {
    setActiveAction('quick-move');
    // 顯示快速移動選項
    const locations = ['台北101', '總統府', '士林夜市', '淡水老街'];
    showQuickOptions(locations, (location) => {
      props.onQuickMove?.(location);
      setActiveAction(null);
    });
  };

  const handleCategoryAction = (category: string) => {
    setActiveAction(category);
    // 根據分類顯示相關景點
    const categoryLocations = getCategoryLocations(category);
    showQuickOptions(categoryLocations, (location) => {
      props.onQuickMove?.(location);
      setActiveAction(null);
    });
  };

  const handleTimeBasedSuggestion = () => {
    const hour = new Date().getHours();
    let suggestions: string[] = [];

    if (hour >= 6 && hour < 10) {
      suggestions = ['陽明山', '象山', '基隆河步道'];
    } else if (hour >= 10 && hour < 14) {
      suggestions = ['總統府', '故宮博物院', '中正紀念堂'];
    } else if (hour >= 14 && hour < 18) {
      suggestions = ['淡水老街', '西門町', '信義商圈'];
    } else if (hour >= 18 && hour < 22) {
      suggestions = ['士林夜市', '寧夏夜市', '饒河夜市'];
    } else {
      suggestions = ['台北101', '24小時咖啡廳', '便利商店'];
    }

    showQuickOptions(suggestions, (location) => {
      props.onQuickMove?.(location);
      setActiveAction(null);
    });
  };

  const handleLocationInfo = () => {
    const player = gameStore.currentPlayer;
    if (player) {
      // 顯示當前位置信息
      console.log(`當前位置: ${player.latitude}, ${player.longitude}`);
    }
  };

  const getCategoryLocations = (category: string): string[] => {
    const locations: Record<string, string[]> = {
      food: ['士林夜市', '寧夏夜市', '逢甲夜市', '六合夜市'],
      culture: ['總統府', '中正紀念堂', '龍山寺', '故宮博物院'],
      nature: ['陽明山', '日月潭', '阿里山', '太魯閣'],
      shopping: ['台北101', '信義商圈', '西門町', '一中商圈']
    };
    return locations[category] || [];
  };

  const showQuickOptions = (options: string[], onSelect: (option: string) => void) => {
    // 這裡可以觸發一個快速選項的彈出界面
    // 暫時使用第一個選項作為示例
    if (options.length > 0) {
      onSelect(options[0]);
    }
  };

  return (
    <div class="fixed bottom-0 left-0 right-0 z-40">
      {/* 玻璃效果背景 */}
      <div
        class="absolute inset-0 bg-white/10 backdrop-blur-xl border-t border-white/20"
        style={{
          "background": "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))"
        }}
      ></div>

      {/* 工具列內容 */}
      <div class="relative px-4 py-3">
        <div class="flex items-center justify-center gap-1 max-w-sm mx-auto">
          <For each={getCoreTools()}>
            {(tool) => (
              <button
                onClick={tool.action}
                class={`group relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                  activeAction() === tool.id
                    ? 'bg-emerald-500/30 shadow-lg'
                    : 'hover:bg-white/20'
                }`}
              >
                {/* 工具圖標 */}
                <div class="relative">
                  <span class="text-xl">{tool.emoji}</span>

                  {/* 徽章 */}
                  {tool.badge && (
                    <div class="absolute -top-1 -right-1 bg-amber-500 text-white text-xs px-1 rounded-full min-w-4 h-4 flex items-center justify-center">
                      {tool.badge}
                    </div>
                  )}
                </div>

                {/* 工具提示 */}
                <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  {tool.label}
                </div>

                {/* 玻璃反光效果 */}
                <div class="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            )}
          </For>
        </div>

        {/* 底部指示器 */}
        <div class="flex justify-center mt-2">
          <div class="w-8 h-1 bg-white/30 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default SmartBottomToolbar;