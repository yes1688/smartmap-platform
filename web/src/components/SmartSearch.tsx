import { Component, createSignal, For, Show, onMount, onCleanup } from 'solid-js';
import { CONFIG } from '@/config';
import { gameStore } from '@/stores/gameStore';

interface SearchResult {
  id: string;
  type: 'location' | 'command' | 'category';
  title: string;
  subtitle?: string;
  emoji: string;
  action: () => void;
}

interface SmartSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickMove?: (location: string) => void;
}

export const SmartSearch: Component<SmartSearchProps> = (props) => {
  const [query, setQuery] = createSignal('');
  const [results, setResults] = createSignal<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [isSearching, setIsSearching] = createSignal(false);

  let inputRef: HTMLInputElement | undefined;

  // 預設建議
  const getDefaultSuggestions = (): SearchResult[] => {
    const hour = new Date().getHours();
    const timeBasedSuggestions: SearchResult[] = [];

    if (hour >= 6 && hour < 10) {
      timeBasedSuggestions.push({
        id: 'morning-1',
        type: 'location',
        title: '陽明山',
        subtitle: '晨間登山，空氣清新',
        emoji: '🌅',
        action: () => handleLocationSelect('陽明山')
      });
    } else if (hour >= 18 && hour < 22) {
      timeBasedSuggestions.push({
        id: 'evening-1',
        type: 'location',
        title: '士林夜市',
        subtitle: '夜市美食，熱鬧非凡',
        emoji: '🍜',
        action: () => handleLocationSelect('士林夜市')
      });
    }

    return [
      {
        id: 'taipei-101',
        type: 'location',
        title: '台北101',
        subtitle: '台北地標，購物觀景',
        emoji: '🏙️',
        action: () => handleLocationSelect('台北101')
      },
      {
        id: 'presidential-office',
        type: 'location',
        title: '總統府',
        subtitle: '歷史建築，政治中心',
        emoji: '🏛️',
        action: () => handleLocationSelect('總統府')
      },
      ...timeBasedSuggestions,
      {
        id: 'food-category',
        type: 'category',
        title: '美食景點',
        subtitle: '夜市、小吃、餐廳',
        emoji: '🍜',
        action: () => handleCategorySelect('food')
      },
      {
        id: 'culture-category',
        type: 'category',
        title: '文化古蹟',
        subtitle: '廟宇、博物館、歷史',
        emoji: '🏛️',
        action: () => handleCategorySelect('culture')
      }
    ];
  };

  // 搜索功能
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(getDefaultSuggestions());
      return;
    }

    setIsSearching(true);

    try {
      // 本地快速匹配
      const localResults = getLocalSearchResults(searchQuery);

      // API搜索（非同步，不阻塞本地結果）
      const apiResults = await getAPISearchResults(searchQuery);

      const combinedResults = [...localResults, ...apiResults];
      setResults(combinedResults.slice(0, 8)); // 限制結果數量
      setSelectedIndex(0);
    } catch (error) {
      console.debug('搜索過程中出現問題，使用本地結果:', error);
      const localResults = getLocalSearchResults(searchQuery);
      setResults(localResults.slice(0, 8));
      setSelectedIndex(0);
    } finally {
      setIsSearching(false);
    }
  };

  const getLocalSearchResults = (searchQuery: string): SearchResult[] => {
    const query = searchQuery.toLowerCase();
    const locations = [
      { name: '台北101', emoji: '🏙️', desc: '台北地標建築' },
      { name: '總統府', emoji: '🏛️', desc: '歷史政治建築' },
      { name: '士林夜市', emoji: '🍜', desc: '台北最大夜市' },
      { name: '淡水老街', emoji: '🌊', desc: '河岸風情老街' },
      { name: '九份老街', emoji: '⛰️', desc: '山城懷舊景點' },
      { name: '日月潭', emoji: '🏞️', desc: '台灣最大湖泊' },
      { name: '阿里山', emoji: '🌸', desc: '賞櫻勝地' },
      { name: '墾丁', emoji: '🏖️', desc: '南國海灘' }
    ];

    return locations
      .filter(loc => loc.name.toLowerCase().includes(query))
      .map(loc => ({
        id: `local-${loc.name}`,
        type: 'location' as const,
        title: loc.name,
        subtitle: loc.desc,
        emoji: loc.emoji,
        action: () => handleLocationSelect(loc.name)
      }));
  };

  const getAPISearchResults = async (searchQuery: string): Promise<SearchResult[]> => {
    try {
      // 使用現有的地點搜索API端點
      const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.endpoints.searchPlace}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return [{
            id: `api-${data.data.name}`,
            type: 'location' as const,
            title: data.data.name,
            subtitle: '搜索結果',
            emoji: '📍',
            action: () => handleLocationSelect(data.data.name)
          }];
        }
      }
    } catch (error) {
      // 靜默處理API錯誤，只依賴本地搜索
      console.debug('API搜索暫不可用，使用本地搜索');
    }
    return [];
  };

  const handleLocationSelect = (location: string) => {
    props.onQuickMove?.(location);
    props.onClose();
  };

  const handleCategorySelect = (category: string) => {
    // 可以觸發分類瀏覽
    console.log(`選擇分類: ${category}`);
    props.onClose();
  };

  // 鍵盤導航
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!props.isOpen) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        props.onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results().length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        const selected = results()[selectedIndex()];
        if (selected) {
          selected.action();
        }
        break;
    }
  };

  // 監聽開啟狀態
  onMount(() => {
    document.addEventListener('keydown', handleKeyDown);
    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  });

  // 當開啟時自動聚焦並載入預設建議
  onMount(() => {
    if (props.isOpen && inputRef) {
      inputRef.focus();
      setResults(getDefaultSuggestions());
    }
  });

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 z-50 flex items-start justify-center pt-20">
        {/* 背景遮罩 */}
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={props.onClose}
        ></div>

        {/* 搜索面板 */}
        <div
          class="relative w-full max-w-2xl mx-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300"
          style={{
            "background": "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))"
          }}
        >
          {/* 搜索輸入框 */}
          <div class="flex items-center gap-3 p-4 border-b border-gray-200/50">
            <div class="flex-shrink-0">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query()}
              onInput={(e) => {
                setQuery(e.currentTarget.value);
                performSearch(e.currentTarget.value);
              }}
              placeholder="搜索地點、指令或分類..."
              class="flex-1 bg-transparent border-none outline-none text-lg placeholder-gray-400"
            />
            {isSearching() && (
              <div class="flex-shrink-0">
                <svg class="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>

          {/* 搜索結果 */}
          <div class="max-h-96 overflow-y-auto">
            <For each={results()}>
              {(result, index) => (
                <button
                  onClick={result.action}
                  class={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-100/50 transition-colors duration-200 ${
                    selectedIndex() === index() ? 'bg-emerald-100/50 border-r-2 border-emerald-500' : ''
                  }`}
                >
                  <div class="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                    {result.emoji}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-gray-900 truncate">{result.title}</div>
                    {result.subtitle && (
                      <div class="text-sm text-gray-500 truncate">{result.subtitle}</div>
                    )}
                  </div>
                  <div class="flex-shrink-0">
                    <div class={`px-2 py-1 rounded-full text-xs ${
                      result.type === 'location' ? 'bg-blue-100 text-blue-700' :
                      result.type === 'category' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {result.type === 'location' ? '地點' :
                       result.type === 'category' ? '分類' : '指令'}
                    </div>
                  </div>
                </button>
              )}
            </For>

            {results().length === 0 && !isSearching() && (
              <div class="p-8 text-center text-gray-500">
                <div class="text-4xl mb-2">🔍</div>
                <div>找不到相關結果</div>
                <div class="text-sm mt-1">試試其他關鍵字</div>
              </div>
            )}
          </div>

          {/* 底部提示 */}
          <div class="p-3 bg-gray-50/50 border-t border-gray-200/50 flex justify-between text-xs text-gray-500">
            <div>↑↓ 選擇 • ⏎ 確認 • ESC 關閉</div>
            <div>Cmd+K 快速開啟</div>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default SmartSearch;