import { createSignal, Show } from 'solid-js';

export interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal(props: WelcomeModalProps) {
  const handleClose = async () => {
    // 請求麥克風權限
    try {
      console.log('🎤 請求麥克風權限...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ 麥克風權限已獲得');
    } catch (error) {
      console.warn('⚠️ 無法獲得麥克風權限:', error);
    }

    // 關閉彈窗
    props.onClose();
  };

  return (
    <Show when={props.isOpen}>
      {/* 背景遮罩 */}
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* 彈窗主體 */}
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* 標題區域 */}
          <div class="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-center">
            <div class="text-4xl mb-2">🐱</div>
            <h2 class="text-xl font-bold text-white mb-1">歡迎來到智慧空間平台</h2>
            <p class="text-blue-100 text-sm">AI 語音控制 × 3D 地圖探索</p>
          </div>

          {/* 內容區域 */}
          <div class="p-6 space-y-4">
            {/* 功能說明 */}
            <div class="space-y-3">
              <div class="flex items-start space-x-3 text-sm">
                <div class="text-2xl">🎤</div>
                <div>
                  <div class="font-semibold text-gray-800">語音控制</div>
                  <div class="text-gray-600 text-xs">按住右下角語音球說話</div>
                </div>
              </div>

              <div class="flex items-start space-x-3 text-sm">
                <div class="text-2xl">🐱</div>
                <div>
                  <div class="font-semibold text-gray-800">移動小貓咪</div>
                  <div class="text-gray-600 text-xs">在 3D 地圖上自由探索台灣</div>
                </div>
              </div>

              <div class="flex items-start space-x-3 text-sm">
                <div class="text-2xl">📍</div>
                <div>
                  <div class="font-semibold text-gray-800">探索景點</div>
                  <div class="text-gray-600 text-xs">搜尋附近景點，左側顯示清單</div>
                </div>
              </div>
            </div>

            {/* 快速開始範例 */}
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
              <p class="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span>💡</span> 快速開始範例
              </p>
              <div class="space-y-2">
                <div class="bg-white rounded-lg p-2 text-xs text-gray-700 border border-blue-100">
                  <span class="font-semibold text-blue-600">移動：</span>
                  「移動小貓咪到台北101」
                </div>
                <div class="bg-white rounded-lg p-2 text-xs text-gray-700 border border-blue-100">
                  <span class="font-semibold text-purple-600">搜尋：</span>
                  「附近有什麼景點」
                </div>
                <div class="bg-white rounded-lg p-2 text-xs text-gray-700 border border-blue-100">
                  <span class="font-semibold text-rose-600">探索：</span>
                  「搜尋台北101附近的美食」
                </div>
              </div>
            </div>

            <div class="text-center">
              <button
                onClick={handleClose}
                class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium px-8 py-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                開始探索 🚀
              </button>
            </div>

            <p class="text-xs text-gray-400 text-center">
              點擊開始後，您可以按住右下角語音球與AI對話
            </p>
          </div>
        </div>
      </div>
    </Show>
  );
}