import { createSignal, Show } from 'solid-js';

export interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal(props: WelcomeModalProps) {
  const handleClose = () => {
    // 直接關閉彈窗，不記住用戶狀態
    props.onClose();
  };

  return (
    <Show when={props.isOpen}>
      {/* 背景遮罩 */}
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* 彈窗主體 */}
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* 標題區域 */}
          <div class="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-center">
            <div class="text-3xl mb-2">🎮</div>
            <h2 class="text-xl font-bold text-white mb-1">溫馨提醒</h2>
            <p class="text-emerald-100 text-sm">歡迎來到智能空間平台</p>
          </div>

          {/* 內容區域 */}
          <div class="p-6 space-y-4">
            <div class="text-center text-gray-700 leading-relaxed">
              <p class="text-base mb-4">
                🤖 <strong>本系統與AI結合</strong>
              </p>
              <p class="text-sm text-gray-600 mb-4">
                過程中請用AI<br />
                <span class="font-semibold text-emerald-600">「移動人物」</span><br />
                來完成一場遊戲
              </p>

              <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
                <p class="text-xs text-emerald-700 mb-2">💡 <strong>快速開始範例：</strong></p>
                <div class="space-y-1 text-xs text-emerald-600">
                  <div>• "移動兔子到台北101"</div>
                  <div>• "移動到我的位置"</div>
                  <div>• "讓兔子做跳躍動作"</div>
                </div>
              </div>
            </div>

            <div class="text-center">
              <button
                onClick={handleClose}
                class="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium px-8 py-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                開始遊戲 🚀
              </button>
            </div>

            <p class="text-xs text-gray-400 text-center">
              點擊開始後，您可以在右下角與AI對話控制兔子玩偶
            </p>
          </div>
        </div>
      </div>
    </Show>
  );
}