import { Component, createSignal, Show } from 'solid-js';

interface VoicePanelProps {
  onClose: () => void;
}

const VoicePanel: Component<VoicePanelProps> = (props) => {
  const [isRecording, setIsRecording] = createSignal(false);
  const [status, setStatus] = createSignal('準備就緒');
  const [isSupported] = createSignal(typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window));

  const handleToggleRecording = () => {
    if (isRecording()) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    // Voice processing is handled by external service
    setIsRecording(true);
    setStatus('連接外部語音處理服務中...');

    // Simulate connection to external voice service
    setTimeout(() => {
      setStatus('語音處理由外部專案處理');
      setIsRecording(false);
    }, 2000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setStatus('準備就緒');
  };

  const processVoiceCommand = (transcript: string) => {
    console.log('Voice command:', transcript);

    // Simple command processing
    const lowerText = transcript.toLowerCase();

    if (lowerText.includes('導航') || lowerText.includes('前往')) {
      setStatus('正在處理導航指令...');
    } else if (lowerText.includes('收集') || lowerText.includes('撿起')) {
      setStatus('正在搜尋附近物品...');
    } else if (lowerText.includes('介紹') || lowerText.includes('說明')) {
      setStatus('正在取得地點資訊...');
    } else if (lowerText.includes('分數') || lowerText.includes('狀態')) {
      setStatus('正在顯示遊戲狀態...');
    } else {
      setStatus('正在與AI助手對話...');
    }

    // Clear status after 3 seconds
    setTimeout(() => {
      setStatus('準備就緒');
    }, 3000);
  };

  return (
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-96 max-w-[90vw] mx-4">
        {/* Panel Header */}
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span class="text-2xl">🎤</span>
            語音控制
          </h3>
          <button
            onClick={props.onClose}
            class="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <span class="text-xl">×</span>
          </button>
        </div>

        {/* Voice Status */}
        <div class="mb-6">
          <div class={`
            p-4 rounded-lg text-center font-medium transition-colors
            ${isRecording()
              ? 'bg-red-100 text-red-700 animate-pulse'
              : 'bg-green-100 text-green-700'
            }
          `}>
            {status()}
          </div>
        </div>

        {/* Recording Button */}
        <div class="text-center mb-6">
          <Show
            when={isSupported()}
            fallback={
              <div class="text-red-600 text-center">
                此瀏覽器不支援語音識別功能
              </div>
            }
          >
            <button
              onClick={handleToggleRecording}
              class={`
                w-20 h-20 rounded-full text-white text-2xl font-bold transition-all duration-200 shadow-lg
                ${isRecording()
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110'
                  : 'bg-red-500 hover:bg-red-600 hover:scale-105'
                }
              `}
            >
              {isRecording() ? '⏹️' : '🎤'}
            </button>
            <div class="mt-2 text-sm text-gray-600">
              {isRecording() ? '點擊停止錄音' : '點擊開始錄音'}
            </div>
          </Show>
        </div>

        {/* Voice Commands Help */}
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <span class="text-blue-500">💡</span>
            語音指令範例
          </h4>
          <ul class="space-y-2 text-sm text-gray-600">
            <li class="flex items-start gap-2">
              <span class="text-blue-500">▸</span>
              "導航到最近的歷史景點"
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-500">▸</span>
              "收集附近的物品"
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-500">▸</span>
              "介紹這個地方"
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-500">▸</span>
              "顯示我的遊戲統計"
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VoicePanel;