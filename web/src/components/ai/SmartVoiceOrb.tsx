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
  let isProcessingCommand = false; // 防止重複處理

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

      // 多語言支援：zh-TW 為主，但也能識別混合中英文
      // Web Speech API 的 lang 只能設定單一語言
      // 但 Chrome/Safari 的 zh-TW 模式通常也能識別英文單詞（地名、人名等）
      recognition.lang = 'zh-TW';
      console.log('   - language: zh-TW (支援中文 + 混合英文)');

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
          // 同時儲存 interim text 作為備用（如果沒有收到 final）
          if (!finalTranscriptText) {
            finalTranscriptText = interimTranscript;
            console.log('📝 暫存 interim text:', interimTranscript);
          }
        } else if (finalTranscript) {
          setInterimText('');
          setPreviewText(`💬 ${finalTranscript}`);
          finalTranscriptText = finalTranscript; // 儲存最終識別文字（覆蓋 interim）
          console.log('✅ 最終識別結果:', finalTranscript);
        }
      };

      recognition.onend = () => {
        console.log('🏁 語音識別結束 (onend 事件)');
        console.log('📝 finalTranscriptText:', finalTranscriptText);
        console.log('📝 previewText:', previewText());
        console.log('📝 isProcessingCommand:', isProcessingCommand);

        // 立即重置錄音狀態
        setIsRecording(false);
        setInterimText('');

        // 獲取要處理的文字：優先使用 finalTranscriptText，否則從 previewText 提取
        let textToProcess = finalTranscriptText;
        if (!textToProcess && previewText()) {
          // 從 previewText 提取文字（去掉表情符號前綴）
          textToProcess = previewText().replace(/^💬\s*/, '').trim();
          console.log('📝 從 previewText 提取文字:', textToProcess);
        }

        // 在識別結束時處理語音指令
        if (textToProcess && !isProcessingCommand) {
          console.log('✅ [onend] 處理最終識別結果:', textToProcess);
          isProcessingCommand = true;
          finalTranscriptText = ''; // 清空避免重複處理
          processVoiceCommand(textToProcess).finally(() => {
            console.log('✅ 指令處理完成，重置所有狀態');
            isProcessingCommand = false;
            // 延遲隱藏並重置所有狀態，讓用戶看到處理結果
            setTimeout(() => {
              setIsActive(false);
              setPreviewText('');
              setShowAiResponse(false);
              setAiResponse('');
            }, 2000);
          });
        } else {
          console.log('⚠️ [onend] 跳過處理:', {
            hasText: !!textToProcess,
            isProcessing: isProcessingCommand
          });
          // 沒有文字或已在處理中，立即重置並隱藏
          setIsActive(false);
          setPreviewText('');
          setShowAiResponse(false);
          setAiResponse('');
        }
      };

      recognition.onerror = (event: any) => {
        console.error('❌ 語音識別錯誤:', event.error);
        finalTranscriptText = ''; // 清空
        isProcessingCommand = false; // 重置處理標記

        setIsRecording(false);
        setInterimText('');
        setPreviewText(`❌ 語音識別錯誤: ${event.error}`);

        // 延遲隱藏並重置所有狀態
        setTimeout(() => {
          setIsActive(false);
          setPreviewText('');
          setShowAiResponse(false);
          setAiResponse('');
        }, 2000);
      };
    } else {
      console.error('❌ 瀏覽器不支援 webkitSpeechRecognition');
    }
  });

  const toggleRecording = async (e?: Event) => {
    // 防止事件傳播和默認行為
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // 防止在處理中重複點擊
    if (isProcessing()) {
      console.log('⚠️ 正在處理中，請稍候...');
      return;
    }

    // 如果正在錄音，則手動停止
    if (isRecording()) {
      console.log('🛑 手動停止錄音');
      if (recognition) {
        recognition.stop();
      }
      setIsRecording(false);
      setInterimText('');
      return;
    }

    // 開始錄音
    console.log('🎤 開始語音錄音（自動停頓偵測模式）...', e?.type || 'unknown event');
    console.log('🔬 ===== 深度分析：語音識別啟動流程 =====');

    try {
      // 重置所有狀態
      console.log('🔄 重置狀態: finalTranscriptText, isProcessingCommand, previewText, interimText');
      finalTranscriptText = '';
      isProcessingCommand = false;

      setIsRecording(true);
      setIsActive(true);
      setIsProcessing(false);
      setPreviewText('🎤 請說話...（說完會自動停止）');
      setInterimText('');
      setAiResponse('');
      setShowAiResponse(false);

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

          console.log('🔥 步驟2: 啟動語音識別服務（自動停頓偵測模式）...');
          console.log('📢 說完話後保持安靜 1-2 秒，系統會自動停止並處理');

          // 啟動深度網路監控
          if (deepAnalysis) {
            console.log('🕵️ 深度網路監控已就緒，準備捕捉隱藏請求...');
          }

          recognition.start();
          console.log('🚀 webkitSpeechRecognition.start() 已調用');
          console.log('⏳ 監聽中... 會自動偵測停頓並結束');

        } catch (permissionError) {
          console.error('❌ 麥克風權限被拒絕:', permissionError);
          setPreviewText('❌ 需要麥克風權限');
          setIsRecording(false);
          setIsActive(true); // 保持顯示錯誤訊息
          setTimeout(() => setIsActive(false), 2000);
          return;
        }
      } else {
        console.error('❌ 瀏覽器不支援語音識別');
        setPreviewText('❌ 瀏覽器不支援語音識別');
        setIsRecording(false);
        setIsActive(true); // 保持顯示錯誤訊息
        setTimeout(() => setIsActive(false), 2000);
      }
    } catch (error) {
      console.error('❌ 啟動錄音失敗:', error);
      setPreviewText('❌ 錄音啟動失敗');
      setIsRecording(false);
      setIsActive(true); // 保持顯示錯誤訊息
      setTimeout(() => setIsActive(false), 2000);
    }
  };


  const processVoiceCommand = async (text: string) => {
    if (!text.trim()) return;

    console.log('🎯 開始處理語音指令:', text);
    setIsProcessing(true);

    try {
      console.log('📡 發送請求到:', `${CONFIG.api.baseUrl}/voice/command`);

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
        console.log('📥 收到 API 回應:', data);
        console.log('📥 intentType:', data.intentType);
        console.log('📥 movement:', data.movement);

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
          console.log('🚶 收到移動指令:', data.movement);
          console.log('🚶 移動成功狀態:', data.movement.success);
          console.log('🚶 新位置資料:', data.movement.newPosition);

          setAiResponse(data.aiResponse || '正在移動...');
          setShowAiResponse(true);

          // Trigger movement callback
          if (props.onMovementResponse) {
            console.log('📞 調用 onMovementResponse callback');
            props.onMovementResponse(data);
          }

          // Update player position in gameStore
          if (data.movement.success && data.movement.newPosition) {
            console.log('✅ 準備更新玩家位置:', {
              lat: data.movement.newPosition.latitude,
              lng: data.movement.newPosition.longitude
            });

            gameActions.setPlayerPosition(
              data.movement.newPosition.latitude,
              data.movement.newPosition.longitude
            );

            console.log('✅ gameActions.setPlayerPosition 已調用');

            // 顯示成功訊息
            setPreviewText(`✅ 已移動到 ${data.movement.newPosition.name || '目的地'}`);
          } else {
            console.error('❌ 移動失敗:', data.movement);
            setPreviewText('❌ 移動失敗');
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

  // 快捷鍵支持 - 空白鍵切換錄音
  onMount(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isRecording() && !isProcessing()) {
        e.preventDefault();
        toggleRecording();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  });

  return (
    <div
      class="fixed bottom-6 right-4 lg:bottom-6 lg:right-6 z-50 flex flex-col items-end gap-3"
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
          onClick={toggleRecording}
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
              // 處理中 - 旋轉載入動畫
              <svg class="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              // 🎤 真實麥克風造型 - 膠囊形狀 + 支架
              <svg
                class={`w-10 h-10 text-white transition-all duration-300 ${isRecording() ? 'scale-125' : 'group-hover:scale-110'}`}
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                viewBox="0 0 24 24"
              >
                {/* 麥克風膠囊主體（頂部圓弧） */}
                <rect x="9" y="2" width="6" height="11" rx="3" fill="currentColor" opacity="0.9"/>

                {/* 麥克風底部弧線（聲音檢測區域） */}
                <path d="M 5 10 Q 5 17 12 17 Q 19 17 19 10" stroke-width="2.5" fill="none"/>

                {/* 麥克風支架（垂直線） */}
                <line x1="12" y1="17" x2="12" y2="21" stroke-width="2.5"/>

                {/* 麥克風底座（橫線） */}
                <line x1="8" y1="21" x2="16" y2="21" stroke-width="2.5"/>
              </svg>
            )}
          </div>

          {/* 玻璃反光效果 */}
          <div class="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>

        {/* 操作提示 */}
        {!isActive() && (
          <div class="absolute -bottom-8 right-0 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            點擊說話（自動停止）
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartVoiceOrb;