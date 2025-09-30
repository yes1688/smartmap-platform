import { Component, Show, createSignal, For } from 'solid-js';
import { gameComputed } from '@/stores/gameStore';

interface GamePanelProps {
  isExpanded: boolean;
  onToggle: () => void;
}

interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
}

const GamePanel: Component<GamePanelProps> = (props) => {
  const [activeMetricTab, setActiveMetricTab] = createSignal('overview');

  const metricCards: MetricCard[] = [
    {
      id: 'level',
      title: '等級',
      value: gameComputed.currentPlayer?.level || 1,
      change: '+2 本週',
      trend: 'up',
      icon: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.228a25.073 25.073 0 012.916.52 6.003 6.003 0 01-4.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0A6.772 6.772 0 0112 15.75c-2.622 0-5.033-.732-7.2-2z',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'score',
      title: '積分',
      value: gameComputed.playerStats.totalScore,
      change: '+156 今天',
      trend: 'up',
      icon: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.228a25.073 25.073 0 012.916.52 6.003 6.003 0 01-4.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0A6.772 6.772 0 0112 15.75c-2.622 0-5.033-.732-7.2-2z',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      id: 'items',
      title: '道具',
      value: gameComputed.playerStats.totalItems,
      change: '穩定',
      trend: 'neutral',
      icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const recentActivities = [
    { time: '2分鐘前', action: '探索新區域', type: 'explore', icon: '🗺️' },
    { time: '5分鐘前', action: '獲得成就獎勵', type: 'achievement', icon: '🏆' },
    { time: '12分鐘前', action: '與AI助手對話', type: 'chat', icon: '💬' },
    { time: '18分鐘前', action: '收集稀有道具', type: 'item', icon: '💎' }
  ];

  return (
    <div class={`fixed top-20 right-6 w-96 max-h-[75vh] transition-all duration-500 ease-out z-30 ${
      props.isExpanded ? 'translate-x-0' : 'translate-x-80'
    }`}>
      <div class="card-elevated animate-slide-up h-full flex flex-col">
        {/* Header */}
        <div class="p-6 border-b border-neutral-200/50 flex-shrink-0">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-sm">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 class="text-heading-sm text-primary">控制台</h3>
                <p class="text-body-sm text-secondary">即時數據監控</p>
              </div>
            </div>

            <button
              onClick={props.onToggle}
              class="btn-ghost btn-icon group"
              title={props.isExpanded ? '收起面板' : '展開面板'}
            >
              <svg
                class={`w-5 h-5 transition-transform duration-300 ${props.isExpanded ? 'rotate-45' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <Show when={props.isExpanded}>
          <div class="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div class="p-4 space-y-4 animate-fade-in">
            {/* Metric Cards Grid */}
            <div>
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-heading-sm text-primary">數據概覽</h4>
                <div class="flex items-center space-x-1">
                  <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-subtle"></div>
                  <span class="text-body-sm text-secondary">即時</span>
                </div>
              </div>

              <div class="grid gap-4">
                <For each={metricCards}>
                  {(metric) => (
                    <div class="card-interactive p-3">
                      <div class="flex items-center justify-between">
                        <div class="flex-1">
                          <div class="flex items-center space-x-3 mb-2">
                            <div class={`w-10 h-10 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center shadow-sm`}>
                              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={metric.icon} />
                              </svg>
                            </div>
                            <div>
                              <p class="text-body-sm text-secondary">{metric.title}</p>
                              <p class="text-heading-lg text-primary font-bold">{metric.value}</p>
                            </div>
                          </div>
                          <div class="flex items-center space-x-2">
                            {metric.trend === 'up' && (
                              <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            )}
                            {metric.trend === 'down' && (
                              <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                              </svg>
                            )}
                            <span class={`text-body-sm font-medium ${
                              metric.trend === 'up' ? 'text-emerald-600' :
                              metric.trend === 'down' ? 'text-red-600' :
                              'text-secondary'
                            }`}>
                              {metric.change}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>

            <div class="divider"></div>

            {/* System Status */}
            <div>
              <h4 class="text-heading-sm text-primary mb-3">系統狀態</h4>
              <div class="card p-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse-subtle"></div>
                    <div>
                      <p class="text-body-md text-primary font-medium">運行中</p>
                      <p class="text-body-sm text-secondary">系統正常運作</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-body-sm text-secondary">連線品質</p>
                    <div class="flex items-center space-x-1 mt-1">
                      <div class="w-1 h-4 bg-emerald-500 rounded-full"></div>
                      <div class="w-1 h-4 bg-emerald-500 rounded-full"></div>
                      <div class="w-1 h-4 bg-emerald-500 rounded-full"></div>
                      <div class="w-1 h-3 bg-emerald-500 rounded-full"></div>
                      <span class="text-body-sm text-primary font-medium ml-2">優良</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="divider"></div>

            {/* Recent Activity */}
            <div>
              <h4 class="text-heading-sm text-primary mb-3">最近活動</h4>
              <div class="space-y-2">
                <For each={recentActivities}>
                  {(activity) => (
                    <div class="flex items-center space-x-3 p-2 rounded-xl hover:bg-neutral-50/50 transition-colors">
                      <div class="text-2xl">{activity.icon}</div>
                      <div class="flex-1">
                        <p class="text-body-md text-primary font-medium">{activity.action}</p>
                        <p class="text-body-sm text-secondary">{activity.time}</p>
                      </div>
                      <svg class="w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </For>
              </div>
            </div>
            </div>
          </div>
        </Show>

        {/* Collapsed State */}
        <Show when={!props.isExpanded}>
          <div class="p-4 flex items-center justify-center">
            <button
              onClick={props.onToggle}
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
  );
};

export default GamePanel;