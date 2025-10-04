import { Component, createSignal } from 'solid-js';
import { gameComputed } from '@/stores/gameStore';

interface HeaderProps {
  // onToggleChat 已移除 - AI 助手按鈕不再需要
}

const Header: Component<HeaderProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal('explore');

  const navigationTabs = [
    { id: 'explore', label: '探索', icon: 'M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z' },
    { id: 'analytics', label: '分析', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
    { id: 'settings', label: '設定', icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z' }
  ];

  return (
    <header class="nav sticky top-0 z-50 animate-fade-in">
      <div class="container">
        <div class="flex items-center justify-between h-16">
          {/* Brand */}
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h1 class="text-heading-sm text-primary">智慧空間平台</h1>
                <p class="text-body-sm text-secondary">Intelligent Spatial Platform</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav class="hidden lg:flex items-center space-x-1 bg-white/50 rounded-2xl p-2 border border-neutral-200/50">
            {navigationTabs.map((tab) => (
              <button
                onClick={() => setActiveTab(tab.id)}
                class={`nav-item flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                  activeTab() === tab.id
                    ? 'nav-item active bg-white shadow-sm'
                    : 'text-secondary hover:text-primary hover:bg-white/50'
                }`}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={tab.icon} />
                </svg>
                <span class="text-body-md font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div class="flex items-center space-x-3">
            {/* AI 助手按鈕已移除 - 專注語音交互 */}

            {/* Status Badge */}
            <div class="flex items-center space-x-2 bg-surface border border-neutral-200/50 rounded-full px-3 py-2">
              <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-subtle"></div>
              <div class="flex flex-col">
                <span class="text-body-sm text-primary font-semibold">{gameComputed.playerStats.totalScore}</span>
                <span class="text-caption text-tertiary">積分</span>
              </div>
            </div>

            {/* User Menu */}
            <button class="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-sm hover:shadow-md transition-all">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;