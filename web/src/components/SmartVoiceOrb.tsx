import { Component, createSignal, onMount, onCleanup } from 'solid-js';
import { CONFIG } from '@/config';
import { gameStore } from '@/stores/gameStore';

interface SmartVoiceOrbProps {
  onMovementResponse?: (result: any) => void;
}

export const SmartVoiceOrb: Component<SmartVoiceOrbProps> = (props) => {
  const [isRecording, setIsRecording] = createSignal(false);
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [previewText, setPreviewText] = createSignal('');
  const [isActive, setIsActive] = createSignal(false);

  let mediaRecorder: MediaRecorder | null = null;
  let recognition: any = null;
  let chunks: Blob[] = [];

  // 語音識別設置
  onMount(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'zh-TW';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setPreviewText(finalTranscript || interimTranscript);

        if (finalTranscript) {
          processVoiceCommand(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('語音識別錯誤:', event.error);
        stopRecording();
      };
    }
  });

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setIsActive(true);
      setPreviewText('');

      if (recognition) {
        // 先請求麥克風權限
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          recognition.start();
        } catch (permissionError) {
          console.warn('麥克風權限被拒絕，請在瀏覽器設定中允許麥克風使用');
          setPreviewText('❌ 需要麥克風權限');
          setIsRecording(false);
          setTimeout(() => setIsActive(false), 2000);
          return;
        }
      }
    } catch (error) {
      console.error('啟動錄音失敗:', error);
      setPreviewText('❌ 錄音啟動失敗');
      setIsRecording(false);
      setTimeout(() => setIsActive(false), 2000);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);

    if (recognition) {
      recognition.stop();
    }

    // 延遲隱藏，讓用戶看到處理結果
    setTimeout(() => setIsActive(false), 2000);
  };

  const processVoiceCommand = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);

    try {
      const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.endpoints.aiChat}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: gameStore.player?.id || 'default_player',
          message: text,
          context: '智慧空間語音控制'
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.type === 'movement' && data.data?.success) {
          // 成功移動
          if (data.data.newPosition) {
            gameStore.setPlayerPosition(
              data.data.newPosition.latitude,
              data.data.newPosition.longitude
            );
          }

          if (props.onMovementResponse) {
            props.onMovementResponse(data.data);
          }

          // 顯示成功反饋
          setPreviewText('✅ 移動成功！');
        } else {
          setPreviewText('❌ 指令無法執行');
        }
      }
    } catch (error) {
      console.error('語音指令處理失敗:', error);
      setPreviewText('❌ 連接失敗');
    } finally {
      setIsProcessing(false);
    }
  };

  // 快捷鍵支持
  onMount(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isRecording()) {
        e.preventDefault();
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isRecording()) {
        e.preventDefault();
        stopRecording();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    });
  });

  return (
    <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* 語音預覽氣泡 */}
      {(isActive() && previewText()) && (
        <div class="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          {previewText()}
        </div>
      )}

      {/* 智能語音球 */}
      <div class="relative">
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          class={`group relative w-16 h-16 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 ${
            isRecording()
              ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-2xl animate-pulse'
              : isProcessing()
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl'
              : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg hover:shadow-xl'
          }`}
          style={{
            "backdrop-filter": "blur(20px)",
            "border": "1px solid rgba(255, 255, 255, 0.2)"
          }}
        >
          {/* 動態波紋效果 */}
          {isRecording() && (
            <>
              <div class="absolute inset-0 rounded-full bg-red-500/30 animate-ping"></div>
              <div class="absolute inset-0 rounded-full bg-red-500/20 animate-ping animation-delay-75"></div>
            </>
          )}

          {/* 中心圖標 */}
          <div class="relative z-10 w-full h-full flex items-center justify-center">
            {isProcessing() ? (
              <svg class="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg
                class={`w-8 h-8 text-white transition-transform duration-300 ${isRecording() ? 'scale-125' : 'group-hover:scale-110'}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </div>

          {/* 玻璃反光效果 */}
          <div class="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>

        {/* 操作提示 */}
        {!isActive() && (
          <div class="absolute -bottom-8 right-0 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            按住說話 / 空格鍵
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartVoiceOrb;