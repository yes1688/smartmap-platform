import { Component, Show } from 'solid-js';
import type { HistoricalSite } from '@/types';

interface HistoricalSitePanelProps {
  site: HistoricalSite;
  onClose: () => void;
}

const HistoricalSitePanel: Component<HistoricalSitePanelProps> = (props) => {
  const handlePlayAudio = () => {
    // Implement audio playback functionality
    console.log('Playing audio guide for:', props.site.name);

    // For now, just show a notification
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        `歡迎來到 ${props.site.name}。${props.site.description}`
      );
      utterance.lang = 'zh-TW';
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div class="absolute bottom-5 left-5 w-[400px] max-w-[90vw] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg z-10">
      {/* Panel Header */}
      <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-xl">
        <h3 class="font-semibold text-gray-800 flex items-center gap-2">
          <span class="text-lg">🏛️</span>
          {props.site.name}
        </h3>
        <button
          onClick={props.onClose}
          class="text-gray-600 hover:text-gray-800 transition-colors p-1 rounded hover:bg-gray-100"
        >
          <span class="text-lg">×</span>
        </button>
      </div>

      {/* Panel Content */}
      <div class="p-4 space-y-4">
        {/* Site Description */}
        <div>
          <p class="text-gray-700 leading-relaxed">
            {props.site.description}
          </p>
        </div>

        {/* Site Era */}
        <div class="flex items-center gap-2 text-sm">
          <span class="font-medium text-gray-600">歷史年代:</span>
          <span class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
            {props.site.era}
          </span>
        </div>

        {/* Visit Count */}
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <span>👥 參觀人次:</span>
          <span class="font-medium">{props.site.visitCount.toLocaleString()}</span>
        </div>

        {/* Address */}
        <Show when={props.site.address}>
          <div class="flex items-start gap-2 text-sm text-gray-600">
            <span class="mt-0.5">📍</span>
            <span>{props.site.address}</span>
          </div>
        </Show>

        {/* AI Introduction */}
        <Show when={props.site.aiIntroduction}>
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border-l-4 border-l-indigo-500">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-indigo-500">🤖</span>
              <span class="font-medium text-indigo-700">AI 導覽介紹</span>
            </div>
            <p class="text-gray-700 leading-relaxed">
              {props.site.aiIntroduction}
            </p>
          </div>
        </Show>

        {/* Action Buttons */}
        <div class="flex gap-2 pt-2">
          <button
            onClick={handlePlayAudio}
            class="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <span>🔊</span>
            <span class="text-sm font-medium">播放語音介紹</span>
          </button>

          <Show when={props.site.images && props.site.images.length > 0}>
            <button
              class="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <span>🖼️</span>
              <span class="text-sm font-medium">查看圖片</span>
            </button>
          </Show>
        </div>

        {/* Coordinates */}
        <div class="pt-2 border-t border-gray-200">
          <div class="text-xs text-gray-500 space-y-1">
            <div>緯度: {props.site.latitude.toFixed(6)}</div>
            <div>經度: {props.site.longitude.toFixed(6)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalSitePanel;