import { Component, createSignal, onMount, onCleanup } from 'solid-js';
import { CONFIG } from '@/config';
import { gameStore, gameActions, setGameState } from '@/stores/gameStore';
import { startDeepAnalysis, BrowserCapabilityAnalyzer } from '@/utils/SpeechAnalyzer';
import { startUltimateAnalysis } from '@/utils/DeepNetworkAnalyzer';

interface SmartVoiceOrbProps {
  onMovementResponse?: (result: any) => void;
}

export const SmartVoiceOrb: Component<SmartVoiceOrbProps> = (props) => {
  const [isRecording, setIsRecording] = createSignal(false);
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [previewText, setPreviewText] = createSignal('');
  const [isActive, setIsActive] = createSignal(false);
  const [interimText, setInterimText] = createSignal('');
  const [aiResponse, setAiResponse] = createSignal('');
  const [showAiResponse, setShowAiResponse] = createSignal(false);

  let mediaRecorder: MediaRecorder | null = null;
  let recognition: any = null;
  let chunks: Blob[] = [];
  let deepAnalysis: any = null;
  let ultimateAnalyzer: any = null;
  let finalTranscriptText = ''; // 儲存最終識別文字

  // 語音識別設置
  onMount(() => {
    console.log('🚀 SmartVoiceOrb 初始化...');

    // 🔬 深度分析瀏覽器能力
    console.log('🔍 ===== 深度技術分析開始 =====');
    const capabilities = BrowserCapabilityAnalyzer.analyze();
    const speechProvider = BrowserCapabilityAnalyzer.detectSpeechProvider();
    console.log(`🎯 語音服務提供商: ${speechProvider}`);

    // 啟動深度分析
    deepAnalysis = startDeepAnalysis();
    console.log('🕵️ 網路請求監控已啟動，將捕捉所有隱藏的 API 調用');

    // 🚀 啟動終極網路分析器
    console.log('🔬 ===== 啟動終極深度分析 =====');
    ultimateAnalyzer = startUltimateAnalysis();
    console.log('🕵️‍♂️ 終極分析器已啟動：XHR, Fetch, WebSocket, Performance API, DOM 監控');

    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      console.log('✅ 瀏覽器支援語音識別');
      console.log('🔍 正在創建 webkitSpeechRecognition 實例...');
      recognition = new (window as any).webkitSpeechRecognition();

      console.log('⚙️ 配置語音識別參數:');
      recognition.continuous = false;
      console.log('   - continuous: false (單次識別)');
      recognition.interimResults = true;
      console.log('   - interimResults: true (即時結果)');
      recognition.lang = 'zh-TW';
      console.log('   - language: zh-TW (繁體中文)');

      console.log('🔧 語音識別配置完成');

      recognition.onresult = (event: any) => {
        console.log('🗣️ 語音識別結果:', event);
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          console.log(`📝 識別文字 ${i}:`, transcript, '最終結果:', event.results[i].isFinal);
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const displayText = finalTranscript || interimTranscript;
        console.log('💬 顯示文字:', displayText);

        // 顯示即時識別結果
        if (interimTranscript && !finalTranscript) {
          setInterimText(`💭 ${interimTranscript}`);
          setPreviewText('');
        } else if (finalTranscript) {
          setInterimText('');
          setPreviewText(`💬 ${finalTranscript}`);
          finalTranscriptText = finalTranscript; // 儲存最終識別文字
        }

        if (finalTranscript) {
          console.log('✅ 最終識別結果:', finalTranscript);
        }
      };

      recognition.onend = () => {
        console.log('🏁 語音識別結束 (onend 事件)');
        console.log('📝 finalTranscriptText:', finalTranscriptText);
        // 在識別結束時處理語音指令
        if (finalTranscriptText) {
          console.log('✅ [onend] 處理最終識別結果:', finalTranscriptText);
          const textToProcess = finalTranscriptText;
          finalTranscriptText = ''; // 先清空，避免重複處理
          processVoiceCommand(textToProcess);
        } else {
          console.log('⚠️ [onend] 沒有最終識別文字');
        }
      };

      recognition.onerror = (event: any) => {
        console.error('❌ 語音識別錯誤:', event.error);
        finalTranscriptText = ''; // 清空
        stopRecording();
      };
    } else {
      console.error('❌ 瀏覽器不支援 webkitSpeechRecognition');
    }
  });

  const startRecording = async (e?: Event) => {
    // 防止事件傳播和默認行為
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('🎤 開始語音錄音...', e?.type || 'unknown event');
    console.log('🔬 ===== 深度分析：語音識別啟動流程 =====');

    try {
      finalTranscriptText = ''; // 重置文字
      setIsRecording(true);
      setIsActive(true);
      setPreviewText('🎤 聆聽中...');

      if (recognition) {
        // 先請求麥克風權限
        try {
          console.log('🔐 步驟1: 請求麥克風權限...');
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('✅ 麥克風權限已獲得');
          console.log('📊 音頻流信息:', {
            active: stream.active,
            tracks: stream.getTracks().map(track => ({
              kind: track.kind,
              label: track.label,
              enabled: track.enabled,
              readyState: track.readyState
            }))
          });

          console.log('🔥 步驟2: 啟動 Google 語音識別服務...');
          console.log('🌐 注意觀察 Network 面板，可能會出現對 Google 服務的請求');

          // 啟動深度網路監控
          if (deepAnalysis) {
            console.log('🕵️ 深度網路監控已就緒，準備捕捉隱藏請求...');
          }

          recognition.start();
          console.log('🚀 webkitSpeechRecognition.start() 已調用');
          console.log('⏳ 等待 Google 語音服務響應...');

        } catch (permissionError) {
          console.error('❌ 麥克風權限被拒絕:', permissionError);
          setPreviewText('❌ 需要麥克風權限');
          setIsRecording(false);
          setTimeout(() => setIsActive(false), 2000);
          return;
        }
      } else {
        console.error('❌ 瀏覽器不支援語音識別');
        setPreviewText('❌ 瀏覽器不支援語音識別');
        setIsRecording(false);
        setTimeout(() => setIsActive(false), 2000);
      }
    } catch (error) {
      console.error('❌ 啟動錄音失敗:', error);
      setPreviewText('❌ 錄音啟動失敗');
      setIsRecording(false);
      setTimeout(() => setIsActive(false), 2000);
    }
  };

  const stopRecording = (e?: Event) => {
    // 防止事件傳播和默認行為
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('🛑 停止語音識別...', e?.type || 'unknown event');
    console.log('🔬 ===== 深度分析：語音識別結束 =====');

    setIsRecording(false);
    setInterimText(''); // 清空即時識別文字

    if (recognition) {
      recognition.stop();
      console.log('🚀 webkitSpeechRecognition.stop() 已調用');
      console.log('⏳ 等待 onend 事件處理語音指令...');

      // 備用機制：如果 500ms 後 onend 還沒觸發，手動處理
      setTimeout(() => {
        if (finalTranscriptText) {
          console.log('⚠️ [備用機制] onend 可能未觸發，手動處理語音指令');
          console.log('📝 finalTranscriptText:', finalTranscriptText);
          const textToProcess = finalTranscriptText;
          finalTranscriptText = ''; // 清空
          processVoiceCommand(textToProcess);
        }
      }, 500);
    }

    // 輸出深度分析結果
    if (deepAnalysis) {
      setTimeout(() => {
        console.log('📊 ===== 深度分析報告 =====');
        const results = deepAnalysis.stop();
        console.log('🔍 完整分析結果:', results);

        if (results.speech.speechRelated.length > 0) {
          console.log('🎯 發現語音相關網路請求:', results.speech.speechRelated);
        } else {
          console.log('🤔 未發現明顯的語音 API 請求（可能被瀏覽器隱藏）');
        }

        console.log(`🌐 語音服務提供商: ${results.speechProvider}`);
        console.log('🔬 瀏覽器能力分析:', results.browserCapabilities);
      }, 1000);
    }

    // 延遲隱藏，讓用戶看到處理結果
    setTimeout(() => setIsActive(false), 2000);
  };

  const processVoiceCommand = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);

    try {
      // First, try the new voice command endpoint for intelligent intent parsing
      const voiceResponse = await fetch(`${CONFIG.api.baseUrl}/voice/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: text,
          playerId: gameStore.currentPlayer?.id || 'default_player',
          lat: gameStore.currentPlayer?.latitude,
          lng: gameStore.currentPlayer?.longitude,
        }),
      });

      if (voiceResponse.ok) {
        const data = await voiceResponse.json();

        // Display usage warning if present
        if (data.usageStats?.warning) {
          console.log('⚠️ AI 使用提醒:', data.usageStats.warning);
          setPreviewText(data.usageStats.warning);
          // Show warning for 3 seconds before showing main response
          setTimeout(() => {
            setPreviewText('');
          }, 3000);
        }

        // Log usage stats
        if (data.usageStats) {
          console.log(`📊 AI 使用統計: ${data.usageStats.used}/${data.usageStats.total} (剩餘 ${data.usageStats.remaining})`);
        }

        // Handle different intent types
        if (data.success && data.intentType === 'search' && data.nearbyResults) {
          // Nearby search result
          console.log('📍 附近搜尋結果:', data.nearbyResults);
          console.log('📍 附近地點資料:', data.nearbyResults.locations);

          // Update gameStore to show red markers on map
          const locations = data.nearbyResults.locations || [];
          setGameState('nearbyLocations', locations);
          console.log('🗺️ 已更新地圖標記:', locations.length, '個地點');

          // Debug: 檢查第一個地點的資料結構
          if (locations.length > 0) {
            console.log('🔍 第一個地點資料:', locations[0]);
            console.log('🔍 座標:', {
              latitude: locations[0].latitude,
              longitude: locations[0].longitude,
              name: locations[0].name
            });
          }

          // Force trigger map update by dispatching custom event
          setTimeout(() => {
            console.log('🔄 手動觸發地圖更新事件');
            window.dispatchEvent(new CustomEvent('nearby-locations-updated', {
              detail: { locations }
            }));
          }, 100);

          setAiResponse(data.aiResponse || `找到 ${data.nearbyResults.total} 個結果`);
          setShowAiResponse(true);
          console.log('🤖 AI 回應:', data.aiResponse);
        } else if (data.intentType === 'move' && data.movement) {
          // Movement command
          setAiResponse(data.aiResponse || '正在移動...');
          setShowAiResponse(true);
          console.log('🚶 移動指令:', data.movement);

          // Trigger movement callback
          if (props.onMovementResponse) {
            props.onMovementResponse(data);
          }

          // Update player position in gameStore
          if (data.movement.success && data.movement.newPosition) {
            gameActions.setPlayerPosition(
              data.movement.newPosition.latitude,
              data.movement.newPosition.longitude
            );
            console.log('✅ 玩家位置已更新:', data.movement.newPosition);
          }
        } else {
          // Other intents (describe, recommend)
          setAiResponse(data.aiResponse || '已處理');
          setShowAiResponse(true);
          console.log('🤖 AI 回應:', data.aiResponse);
        }

        setIsProcessing(false);
        return;
      }

      // Handle voice command errors
      if (voiceResponse.status === 429) {
        // Rate limit error
        const errorData = await voiceResponse.json();
        setAiResponse(errorData.message || '⏳ AI 服務繁忙，請稍候再試');
        setShowAiResponse(true);
        setIsProcessing(false);
        return;
      }

      // Fallback to regular AI chat if voice command fails
      const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.endpoints.aiChat}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: gameStore.currentPlayer?.id || 'default_player',
          message: text,
          context: '智慧空間語音控制'
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // 顯示 AI 回應訊息
        if (data.response) {
          setAiResponse(data.response);
          setShowAiResponse(true);
          console.log('🤖 AI 回應:', data.response);

          // 同時顯示在預覽文字中
          setPreviewText(`🤖 ${data.response}`);
        }

        if (data.type === 'movement' && data.data?.success) {
          // 成功移動
          if (data.data.newPosition) {
            // 更新玩家位置
            gameActions.setPlayerPosition(
              data.data.newPosition.latitude,
              data.data.newPosition.longitude
            );
          }

          if (props.onMovementResponse) {
            props.onMovementResponse(data.data);
          }

          // 顯示成功反饋（保留 AI 訊息，添加成功標記）
          if (data.response) {
            setPreviewText(`✅ ${data.response}`);
          } else {
            setPreviewText('✅ 移動成功！');
          }
        } else if (data.response) {
          // 只有 AI 回應，沒有移動成功
          setPreviewText(`🤖 ${data.response}`);
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
    <div
      class="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-50 flex flex-col items-end gap-3"
      style={{
        "user-select": "none",
        "-webkit-user-select": "none",
        "-webkit-touch-callout": "none"
      }}
    >
      {/* AI 回應訊息氣泡 - 較大且更突出 */}
      {showAiResponse() && aiResponse() && (
        <div class="bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-md text-white px-4 py-3 rounded-xl text-sm max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500 shadow-lg border border-white/20">
          <div class="flex items-start gap-2">
            <div class="text-lg">🤖</div>
            <div class="flex-1 leading-relaxed">{aiResponse()}</div>
          </div>
        </div>
      )}

      {/* 語音預覽氣泡 - 語音識別和狀態 */}
      {(isActive() && (previewText() || interimText())) && (
        <div class="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* 即時識別文字 - 半透明顯示 */}
          {interimText() ? (
            <div class="opacity-70 animate-pulse">
              {interimText()}
            </div>
          ) : (
            previewText()
          )}
        </div>
      )}

      {/* 智能語音球 */}
      <div class="relative" style={{
        "user-select": "none",
        "-webkit-user-select": "none",
        "-webkit-touch-callout": "none"
      }}>
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          onTouchCancel={stopRecording}
          class={`group relative w-16 h-16 lg:w-16 lg:h-16 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 ${
            isRecording()
              ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-2xl animate-pulse'
              : isProcessing()
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl'
              : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg hover:shadow-xl'
          }`}
          style={{
            "backdrop-filter": "blur(20px)",
            "border": "1px solid rgba(255, 255, 255, 0.2)",
            "touch-action": "none",
            "-webkit-tap-highlight-color": "transparent",
            "user-select": "none",
            "-webkit-user-select": "none",
            "-webkit-touch-callout": "none",
            "-webkit-user-drag": "none"
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