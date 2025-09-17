import { Component, createSignal, onCleanup, onMount } from 'solid-js';
import { gameStore, setCurrentPlayer } from '@/stores/gameStore';

interface VoiceControlProps {
  onVoiceCommand: (text: string) => void;
}

interface BrowserInfo {
  name: string;
  mimeType: string;
  ext: string;
  isSupported: boolean;
  webCodecsSupported?: boolean;
  recordingMethod?: 'webcodecs' | 'mediarecorder';
}

interface WebCodecsInfo {
  audioEncoder: boolean;
  audioDecoder: boolean;
  opusSupported: boolean;
  fullSupported: boolean;
}

const VoiceControl: Component<VoiceControlProps> = (props) => {
  const [isRecording, setIsRecording] = createSignal(false);
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [lastTranscription, setLastTranscription] = createSignal('');
  const [error, setError] = createSignal('');

  let mediaRecorder: MediaRecorder | null = null;
  let audioEncoder: AudioEncoder | null = null;
  let audioChunks: Blob[] = [];
  let audioPackets: Uint8Array[] = [];
  let recordingStartTime: number = 0;

  // WebCodecs 支援檢測 - 來自 Speech Ear
  const detectWebCodecsSupport = (): WebCodecsInfo => {
    const hasAudioEncoder = typeof AudioEncoder !== 'undefined';
    const hasAudioDecoder = typeof AudioDecoder !== 'undefined';

    let opusSupported = false;
    if (hasAudioEncoder) {
      try {
        const testConfig = {
          codec: 'opus',
          sampleRate: 48000,
          numberOfChannels: 1,
          bitrate: 128000
        };
        // 簡化檢測邏輯，直接嘗試創建編碼器
        try {
          const testEncoder = new AudioEncoder({
            output: () => {},
            error: () => {}
          });
          testEncoder.configure(testConfig);
          testEncoder.close();
          opusSupported = true;
        } catch {
          opusSupported = false;
        }
      } catch (e) {
        console.warn('WebCodecs OPUS 支援檢測失敗:', e);
        opusSupported = false;
      }
    }

    const fullSupported = hasAudioEncoder && hasAudioDecoder && opusSupported;

    return {
      audioEncoder: hasAudioEncoder,
      audioDecoder: hasAudioDecoder,
      opusSupported: opusSupported,
      fullSupported: fullSupported
    };
  };

  // 檢測瀏覽器和支援的格式 - 來自 Speech Ear 實證實現
  const detectBrowser = (): BrowserInfo => {
    const ua = navigator.userAgent;
    const webCodecs = detectWebCodecsSupport();

    if (ua.includes('Chrome') && !ua.includes('Edge')) {
      const mimeType = 'audio/webm;codecs=opus';
      return {
        name: 'Chrome',
        mimeType,
        ext: 'webm',
        isSupported: MediaRecorder.isTypeSupported(mimeType),
        webCodecsSupported: webCodecs.fullSupported,
        recordingMethod: webCodecs.fullSupported ? 'webcodecs' : 'mediarecorder'
      };
    } else if (ua.includes('Edge')) {
      const mimeType = 'audio/webm;codecs=opus';
      return {
        name: 'Edge',
        mimeType,
        ext: 'webm',
        isSupported: MediaRecorder.isTypeSupported(mimeType),
        webCodecsSupported: webCodecs.fullSupported,
        recordingMethod: webCodecs.fullSupported ? 'webcodecs' : 'mediarecorder'
      };
    } else if (ua.includes('Firefox')) {
      const mimeType = 'audio/ogg;codecs=opus';
      return {
        name: 'Firefox',
        mimeType,
        ext: 'ogg',
        isSupported: MediaRecorder.isTypeSupported(mimeType),
        webCodecsSupported: webCodecs.fullSupported,
        recordingMethod: webCodecs.fullSupported ? 'webcodecs' : 'mediarecorder'
      };
    } else if (ua.includes('Safari')) {
      const mimeType = 'audio/mp4';
      return {
        name: 'Safari',
        mimeType,
        ext: 'mp4',
        isSupported: MediaRecorder.isTypeSupported(mimeType),
        webCodecsSupported: webCodecs.fullSupported,
        recordingMethod: webCodecs.fullSupported ? 'webcodecs' : 'mediarecorder'
      };
    }

    // 未知瀏覽器，嘗試通用格式
    const fallbackMime = 'audio/webm';
    return {
      name: 'Unknown',
      mimeType: fallbackMime,
      ext: 'webm',
      isSupported: MediaRecorder.isTypeSupported(fallbackMime),
      webCodecsSupported: webCodecs.fullSupported,
      recordingMethod: webCodecs.fullSupported ? 'webcodecs' : 'mediarecorder'
    };
  };

  // 開始錄音
  const startRecording = async () => {
    try {
      setError('');

      // 使用 Speech Ear 的音頻配置
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      // 診斷：檢查瀏覽器實際提供的音頻配置
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const trackSettings = audioTrack.getSettings();
        console.log('🔍 瀏覽器實際音頻配置:', trackSettings);
        console.log(`  - 實際採樣率: ${trackSettings.sampleRate}Hz`);
        console.log(`  - 實際聲道數: ${trackSettings.channelCount}`);
        console.log(`  - 配置匹配: ${trackSettings.sampleRate === 48000 ? '✅ 一致' : '⚠️ 不匹配'}`);
      }

      // 使用 Speech Ear 的瀏覽器檢測邏輯
      const browser = detectBrowser();
      console.log('🌐 檢測到瀏覽器:', browser);
      console.log('🚀 WebCodecs 支援:', browser.webCodecsSupported);
      console.log('🎤 錄音方式:', browser.recordingMethod);

      if (!browser.isSupported) {
        throw new Error(`瀏覽器 ${browser.name} 不支援音頻格式 ${browser.mimeType}`);
      }

      // 智能錄音方式選擇
      if (browser.recordingMethod === 'webcodecs' && browser.webCodecsSupported) {
        console.log('🚀 使用 WebCodecs 硬體加速錄音');
        await startWebCodecsRecording(stream);
      } else {
        console.log('📼 使用 MediaRecorder 相容模式錄音');
        await startMediaRecorderRecording(stream);
      }

      recordingStartTime = Date.now();

    } catch (err) {
      console.error('❌ 錄音失敗:', err);
      setError('無法存取麥克風，請檢查權限設定');
    }
  };

  // WebCodecs 錄音實現
  const startWebCodecsRecording = async (stream: MediaStream) => {
    console.log('🚀 啟動 WebCodecs 硬體加速錄音');

    audioPackets = [];

    try {
      audioEncoder = new AudioEncoder({
        output: (chunk, metadata) => {
          console.log(`🎵 WebCodecs 獨立包輸出: ${chunk.byteLength} bytes`);
          const packetData = new Uint8Array(chunk.byteLength);
          chunk.copyTo(packetData);
          audioPackets.push(packetData);
          console.log(`📦 收集到 OPUS 包 ${audioPackets.length}: ${packetData.length} bytes`);
        },
        error: (error) => {
          console.error('🚨 WebCodecs 編碼錯誤:', error);
          setError(`WebCodecs 編碼失敗: ${error.message}`);
        }
      });

      const optimizedEncoderConfig = {
        codec: 'opus',
        sampleRate: 48000,
        numberOfChannels: 1,
        bitrate: 96000,
      };

      audioEncoder.configure(optimizedEncoderConfig);

      const track = stream.getAudioTracks()[0];
      const processor = new MediaStreamTrackProcessor({ track });
      const reader = processor.readable.getReader();

      const processAudioFrames = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          if (audioEncoder && audioEncoder.state === 'configured') {
            try {
              audioEncoder.encode(value);
            } catch (err) {
              console.error('🚨 音頻幀編碼失敗:', err);
            }
          }
          value.close();
        }
      };

      processAudioFrames().catch(err => {
        console.error('🚨 音頻處理流程錯誤:', err);
        setError(`WebCodecs 音頻處理失敗: ${err.message}`);
      });

      setIsRecording(true);
      console.log('✅ WebCodecs 錄音已啟動');

    } catch (error) {
      console.error('🚨 WebCodecs 初始化失敗:', error);
      setError(`WebCodecs 初始化失敗: ${error.message}`);
    }
  };

  // MediaRecorder 錄音實現
  const startMediaRecorderRecording = async (stream: MediaStream) => {
    console.log('📼 啟動 MediaRecorder 相容模式錄音');

    const browser = detectBrowser();
    const mimeType = browser.mimeType;

    mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 64000
    });

    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: mimeType });

      console.log(`✅ MediaRecorder 錄音完成 - 格式: ${mimeType}, 大小: ${audioBlob.size} bytes`);

      stream.getTracks().forEach(track => track.stop());
      await transcribeAudio(audioBlob);
    };

    mediaRecorder.start();
    setIsRecording(true);
    console.log('✅ MediaRecorder 錄音已啟動');
  };

  // 停止錄音
  const stopRecording = () => {
    const browser = detectBrowser();

    if (browser.recordingMethod === 'webcodecs' && audioEncoder) {
      console.log('🛑 停止 WebCodecs 錄音');
      try {
        audioEncoder.flush();
        audioEncoder.close();
        audioEncoder = null;

        if (audioPackets.length > 0) {
          const packetsData = {
            format: 'webcodecs_opus_packets',
            packet_count: audioPackets.length,
            packets: audioPackets.map(packet => Array.from(packet))
          };

          const jsonBlob = new Blob([JSON.stringify(packetsData)], { type: 'application/json' });

          console.log(`✅ WebCodecs 錄音完成 - 格式: 獨立包模式, 包數量: ${audioPackets.length}, JSON 大小: ${jsonBlob.size} bytes`);

          transcribeAudio(jsonBlob);
        } else {
          console.warn('⚠️ WebCodecs 錄音沒有收集到獨立包');
          setError('錄音失敗：沒有收集到音頻包數據');
        }

      } catch (error) {
        console.error('🚨 WebCodecs 停止錄音時出錯:', error);
        setError('停止錄音時發生錯誤');
      }

    } else if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('🛑 停止 MediaRecorder 錄音');
      mediaRecorder.stop();
    }

    setIsRecording(false);
    setIsProcessing(true);
  };

  // 語音轉文字
  const transcribeAudio = async (audioBlob: Blob) => {
    console.log('🎯 transcribeAudio 函數被呼叫');
    try {
      // 檢查錄音時間和大小
      const recordingDuration = Date.now() - recordingStartTime;
      console.log('⏱️ 錄音時長:', recordingDuration, 'ms');

      if (recordingDuration < 500) {
        setError('錄音時間太短，請至少說話 0.5 秒');
        return;
      }

      if (audioBlob.size < 100) {
        setError('音頻數據太小，請重新錄音');
        return;
      }

      const formData = new FormData();
      const browser = detectBrowser();

      // 智能上傳格式選擇
      if (audioBlob.type === 'application/json' && browser.recordingMethod === 'webcodecs') {
        // WebCodecs 獨立包模式
        const fileName = 'webcodecs-packets.json';
        formData.append('audio_packets', audioBlob, fileName);

        console.log(`🚀 WebCodecs 獨立包上傳 - 檔案: ${fileName}, MIME: ${audioBlob.type}, 大小: ${audioBlob.size} bytes`);
        console.log('🎯 使用統一端點，JSON 格式自動檢測');
      } else {
        // MediaRecorder 傳統格式
        const fileName = `recording.${browser.ext}`;
        formData.append('audio', audioBlob, fileName);

        console.log(`📼 MediaRecorder 上傳 - 檔案: ${fileName}, MIME: ${audioBlob.type}, 瀏覽器: ${browser.name}`);
        console.log('🎯 使用統一端點，二進制格式自動檢測');
      }

      console.log('🔄 傳送音頻到 Speech Ear API...');
      console.log('📁 音頻大小:', (audioBlob.size / 1024).toFixed(2), 'KB');
      console.log('🎵 音頻類型:', audioBlob.type);
      console.log('📊 音頻 chunks 數量:', audioChunks.length);

      const speechEarUrl = import.meta.env.VITE_SPEECH_EAR_URL || 'http://localhost:3001';
      console.log('🌐 Speech Ear URL:', speechEarUrl);
      console.log('🔧 Environment variable:', import.meta.env.VITE_SPEECH_EAR_URL);
      const response = await fetch(`${speechEarUrl}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🚨 Speech Ear API 錯誤回應:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ 語音轉文字結果:', result);

      // 支援多種回應格式 (Care Voice 和 Speech Ear)
      const transcription = result.transcript || result.full_transcript || result.text;
      if (transcription && transcription.trim()) {
        const finalTranscription = transcription.trim();
        setLastTranscription(finalTranscription);

        // 傳送語音指令
        props.onVoiceCommand(finalTranscription);

        console.log('🎯 語音指令:', finalTranscription);
        console.log('⚡ 處理時間:', result.processing_time_ms, 'ms');
        console.log('🎯 信心度:', result.confidence ? (result.confidence * 100).toFixed(1) + '%' : '未知');
        console.log('🤖 使用模型:', result.model_used);
        if (result.summary) console.log('📝 摘要:', result.summary);
      } else {
        setError('未能識別語音內容，請重試');
      }

    } catch (err) {
      console.error('❌ 語音轉文字失敗:', err);
      setError('語音處理失敗：' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 統一的按壓和釋放處理（支援桌面和行動裝置）
  const handlePressStart = (e: Event) => {
    e.preventDefault();
    console.log('🖱️ 按下按鈕，當前狀態 - 錄音:', isRecording(), '處理:', isProcessing());

    if (!isRecording() && !isProcessing()) {
      console.log('🎤 開始錄音流程...');
      startRecording();

      // 全域釋放事件監聽器
      const handleGlobalRelease = (event: Event) => {
        console.log('🖱️ 全域釋放事件，當前錄音狀態:', isRecording());
        if (isRecording()) {
          console.log('🛑 停止錄音流程...');
          stopRecording();
        }
        // 清理所有事件監聽器
        document.removeEventListener('mouseup', handleGlobalRelease);
        document.removeEventListener('touchend', handleGlobalRelease);
        document.removeEventListener('touchcancel', handleGlobalRelease);
      };

      // 添加所有可能的釋放事件
      document.addEventListener('mouseup', handleGlobalRelease);
      document.addEventListener('touchend', handleGlobalRelease);
      document.addEventListener('touchcancel', handleGlobalRelease); // 處理觸控取消
    }
  };

  // 觸控專用處理（防止滾動干擾）
  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault(); // 防止滾動
    e.stopPropagation(); // 防止事件冒泡
    handlePressStart(e);
  };

  // 滑鼠專用處理
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handlePressStart(e);
  };

  // 鍵盤快捷鍵支援（空白鍵）
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !e.repeat && !isRecording() && !isProcessing()) {
      e.preventDefault();
      e.stopPropagation();
      console.log('⌨️ 空白鍵按下，開始錄音');
      handlePressStart(e);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space' && isRecording()) {
      e.preventDefault();
      e.stopPropagation();
      console.log('⌨️ 空白鍵釋放，停止錄音');
      stopRecording();
    }
  };

  // 全域鍵盤監聽
  onMount(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  });

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  });

  // 清理資源
  onCleanup(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  });

  return (
    <div class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      {/* 訊息區域 - 固定在按鈕上方，不影響按鈕位置 */}
      <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 flex flex-col items-center gap-3">

        {/* 最後轉錄結果 - 統一 ChatPanel 風格 */}
        {lastTranscription() && (
          <div class="relative bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm rounded-2xl shadow-xl p-4 max-w-xs border border-gray-200/50 animate-fadeIn">
            <div class="absolute -top-2 left-4 w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-sm">
              <span class="text-white text-xs">✅</span>
            </div>
            <div class="pt-2">
              <div class="text-xs text-emerald-600 font-semibold mb-2">語音識別成功：</div>
              <div class="text-sm text-gray-800 font-medium">"{lastTranscription()}"</div>
            </div>
            {/* Message tail */}
            <div class="absolute bottom-2 left-2 w-4 h-4 bg-gradient-to-br from-white to-gray-50 border-l border-b border-gray-200/50 transform rotate-45"></div>
          </div>
        )}

        {/* 錯誤訊息 - 統一 ChatPanel 風格 */}
        {error() && (
          <div class="relative bg-gradient-to-br from-red-50 to-red-100 backdrop-blur-sm rounded-2xl shadow-xl p-4 max-w-xs border border-red-200/50 animate-fadeIn">
            <div class="absolute -top-2 left-4 w-6 h-6 bg-gradient-to-br from-red-400 to-red-500 rounded-full flex items-center justify-center shadow-sm">
              <span class="text-white text-xs">❌</span>
            </div>
            <div class="pt-2">
              <div class="text-xs text-red-600 font-semibold mb-2">語音處理錯誤：</div>
              <div class="text-sm text-red-700 mb-3">{error()}</div>
              <button
                onClick={() => setError('')}
                class="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-medium rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
              >
                重試
              </button>
            </div>
            {/* Message tail */}
            <div class="absolute bottom-2 left-2 w-4 h-4 bg-gradient-to-br from-red-50 to-red-100 border-l border-b border-red-200/50 transform rotate-45"></div>
          </div>
        )}

        {/* 快捷鍵提示 - 僅桌面顯示 */}
        <div class="hidden lg:block text-center">
          <div class="text-xs text-gray-500 bg-gray-100/80 backdrop-blur-sm rounded-lg px-3 py-1">
            💡 按 <kbd class="bg-white px-2 py-1 rounded text-gray-700 font-mono text-xs shadow-sm">空白鍵</kbd> 快速錄音
          </div>
        </div>
      </div>

      {/* 主要按鈕區域 - 固定位置 */}
      <div class="flex flex-col items-center gap-3">

        {/* 主要錄音按鈕 - 完整無障礙和行動裝置支援 */}
        <button
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          disabled={isProcessing()}
          tabIndex={0}
          aria-label={
            isRecording() ? '正在錄音，鬆開停止' :
            isProcessing() ? 'AI 正在處理語音' :
            '按住開始錄音，或按空白鍵'
          }
          aria-pressed={isRecording()}
          aria-busy={isProcessing()}
          role="button"
          class={`
            w-20 h-20 rounded-full shadow-xl border-4 border-white/20 backdrop-blur-sm
            transition-all duration-300 flex items-center justify-center
            select-none touch-manipulation
            ${isRecording()
              ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 scale-110 animate-pulse'
              : isProcessing()
              ? 'bg-gradient-to-br from-yellow-500 to-orange-500 animate-spin'
              : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105 active:scale-95'
            }
            ${isProcessing() ? 'cursor-wait' : 'cursor-pointer'}
            focus:outline-none focus:ring-4 focus:ring-blue-300/50
            /* 行動裝置觸控優化 */
            lg:hover:scale-105
            active:scale-95
            touch-action-none
          `}
          style={{
            /* 防止選取和上下文選單 */
            'user-select': 'none',
            '-webkit-user-select': 'none',
            '-webkit-touch-callout': 'none',
            /* 確保觸控回應 */
            'min-height': '80px',
            'min-width': '80px'
          }}
        >
          {isProcessing() ? (
            <div class="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd"></path>
            </svg>
          )}
        </button>

        {/* 狀態顯示 - 優化視覺效果和無障礙 */}
        <div
          class="text-center px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {isRecording() && (
            <div class="text-red-600 text-sm font-semibold animate-pulse flex items-center gap-2">
              <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse" aria-hidden="true"></div>
              <span>錄音中...</span>
              <span class="sr-only">正在錄製語音，請繼續說話</span>
            </div>
          )}
          {isProcessing() && (
            <div class="text-yellow-600 text-sm font-semibold flex items-center gap-2">
              <div class="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" aria-hidden="true"></div>
              <span>AI 處理中...</span>
              <span class="sr-only">人工智慧正在處理您的語音輸入</span>
            </div>
          )}
          {!isRecording() && !isProcessing() && (
            <div class="text-gray-600 text-sm font-medium flex items-center gap-2">
              <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 715 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd"></path>
              </svg>
              <span>按住說話</span>
              <span class="sr-only">按住按鈕或按空白鍵開始語音輸入</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default VoiceControl;