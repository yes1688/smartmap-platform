import { Component, Show, For, createSignal, onMount, onCleanup } from 'solid-js';
import { gameComputed } from '@/stores/gameStore';

interface NearbyLocationsListProps {
  onLocationClick?: (location: any) => void;
}

// 滾動條樣式
const scrollbarStyles = `
  .nearby-scroll::-webkit-scrollbar {
    width: 8px;
  }
  .nearby-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .nearby-scroll::-webkit-scrollbar-thumb {
    background: rgb(251, 113, 133);
    border-radius: 4px;
  }
  .nearby-scroll::-webkit-scrollbar-thumb:hover {
    background: rgb(244, 63, 94);
  }
`;

const NearbyLocationsList: Component<NearbyLocationsListProps> = (props) => {
  const [isVisible, setIsVisible] = createSignal(false);
  const [isExpanded, setIsExpanded] = createSignal(true);

  // 監聽附近地點更新事件
  onMount(() => {
    const handleNearbyUpdate = (event: any) => {
      const locations = event.detail?.locations || [];
      console.log('📍 NearbyLocationsList 收到更新事件:', locations.length);

      if (locations.length > 0) {
        setIsVisible(true);
        setIsExpanded(true);
      }
    };

    window.addEventListener('nearby-locations-updated', handleNearbyUpdate);

    onCleanup(() => {
      window.removeEventListener('nearby-locations-updated', handleNearbyUpdate);
    });
  });

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded());
  };

  const handleLocationClick = (location: any) => {
    console.log('📍 點擊地點:', location.name);
    if (props.onLocationClick) {
      props.onLocationClick(location);
    }
  };

  // 獲取附近地點列表
  const nearbyLocations = () => gameComputed.nearbyLocations || [];

  return (
    <Show when={isVisible()}>
      <style>{scrollbarStyles}</style>
      <div class={`fixed top-20 left-6 w-80 transition-all duration-500 ease-out z-30 ${
        isExpanded() ? 'translate-x-0' : '-translate-x-72'
      }`}>
        <div class="card-elevated animate-slide-up max-h-[calc(100vh-120px)] flex flex-col shadow-xl">
          {/* Header */}
          <div class="p-4 border-b border-neutral-200/50 flex-shrink-0">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-sm">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-primary">附近景點</h3>
                  <p class="text-xs text-secondary">共 {nearbyLocations().length} 個</p>
                </div>
              </div>

              <div class="flex items-center space-x-1">
                <button
                  onClick={handleToggle}
                  class="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                  title={isExpanded() ? '收起面板' : '展開面板'}
                >
                  <svg
                    class={`w-4 h-4 text-secondary transition-transform duration-300 ${isExpanded() ? '' : 'rotate-180'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleClose}
                  class="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="關閉"
                >
                  <svg
                    class="w-4 h-4 text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <Show when={isExpanded()}>
            <div
              class="flex-1 overflow-y-auto overflow-x-hidden nearby-scroll"
              style="
                scrollbar-width: thin;
                scrollbar-color: rgb(251, 113, 133) transparent;
              "
            >
              <div class="p-3 pb-4 space-y-1.5 animate-fade-in">
                <Show
                  when={nearbyLocations().length > 0}
                  fallback={
                    <div class="text-center py-8">
                      <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p class="text-sm text-secondary">暫無附近景點</p>
                      <p class="text-xs text-tertiary mt-1">試試說「附近有什麼景點」</p>
                    </div>
                  }
                >
                  <For each={nearbyLocations()}>
                    {(location, index) => (
                      <div
                        class="bg-white hover:bg-rose-50/50 border border-neutral-200/50 rounded-lg p-2.5 cursor-pointer hover:border-rose-300 transition-all group"
                        onClick={() => handleLocationClick(location)}
                      >
                        <div class="flex items-center space-x-2.5">
                          {/* Number Badge */}
                          <div class="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg flex items-center justify-center shadow-sm">
                            <span class="text-white text-xs font-bold">{index() + 1}</span>
                          </div>

                          {/* Location Info */}
                          <div class="flex-1 min-w-0">
                            <h4 class="text-sm font-semibold text-primary truncate">
                              {location.name}
                            </h4>

                            <div class="flex items-center space-x-2 mt-0.5">
                              <Show when={location.type}>
                                <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-xs">
                                  {location.type}
                                </span>
                              </Show>

                              {/* Distance (if available) */}
                              <Show when={location.distance}>
                                <span class="text-xs text-tertiary">
                                  {location.distance.toFixed(0)}m
                                </span>
                              </Show>
                            </div>

                            <Show when={location.address}>
                              <p class="text-xs text-secondary truncate mt-0.5">
                                {location.address}
                              </p>
                            </Show>
                          </div>

                          {/* Arrow Icon */}
                          <div class="flex-shrink-0">
                            <svg class="w-4 h-4 text-tertiary group-hover:text-rose-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </Show>
              </div>
            </div>
          </Show>

          {/* Collapsed State */}
          <Show when={!isExpanded()}>
            <div class="p-4 flex items-center justify-center">
              <button
                onClick={handleToggle}
                class="w-full btn-ghost text-center py-3 rounded-xl"
              >
                <svg class="w-6 h-6 mx-auto text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
};

export default NearbyLocationsList;
