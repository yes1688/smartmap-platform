import { Component, createSignal } from 'solid-js';
import { gameComputed } from '@/stores/gameStore';

interface HeaderProps {
  // onToggleChat 已移除 - AI 助手按鈕不再需要
}

const Header: Component<HeaderProps> = (props) => {
  // 移除導航標籤 - 簡化界面，專注語音
  // const [activeTab, setActiveTab] = createSignal('explore');
  // const navigationTabs = [...];


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

          {/* 移除導航標籤 - 簡化界面 */}

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