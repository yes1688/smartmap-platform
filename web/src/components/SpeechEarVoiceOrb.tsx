import { Component, createSignal, onMount, onCleanup } from 'solid-js';
import { CONFIG } from '@/config';
import { gameStore, gameActions } from '@/stores/gameStore';

interface SpeechEarVoiceOrbProps {
  onMovementResponse?: (result: any) => void;
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

export const SpeechEarVoiceOrb: Component<SpeechEarVoiceOrbProps> = (props) => {
  const [isRecording, setIsRecording] = createSignal(false);
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [previewText, setPreviewText] = createSignal('');
  const [dynamicText, setDynamicText] = createSignal('');
  const [isActive, setIsActive] = createSignal(false);

  let mediaRecorder: MediaRecorder | null = null;
  let audioEncoder: AudioEncoder | null = null;
  let audioChunks: Blob[] = [];
  let audioPackets: Uint8Array[] = [];
  let recordingStartTime: number = 0;
  let dynamicTextInterval: number | null = null;

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

  // 動態文字效果
  const startDynamicTextEffect = () => {
    const phrases = [
      '🎤 聆聽中...',
      '👂 正在識別...',
      '🧠 理解語音...',
      '💭 分析語意...',
      '🔍 處理指令...',
      '⚡ 準備回應...'
    ];

    let currentIndex = 0;

    dynamicTextInterval = setInterval(() => {
      setDynamicText(phrases[currentIndex]);
      currentIndex = (currentIndex + 1) % phrases.length;
    }, 800) as any;
  };

  const stopDynamicTextEffect = () => {
    if (dynamicTextInterval) {
      clearInterval(dynamicTextInterval);
      dynamicTextInterval = null;
    }
    setDynamicText('');
  };

  // 語音識別系統初始化
  onMount(() => {
    console.log('🚀 Speech Ear 語音球初始化...');
    const browser = detectBrowser();
    const webCodecs = detectWebCodecsSupport();

    console.log('🌐 檢測到瀏覽器:', browser);
    console.log('🚀 WebCodecs 支援:', browser.webCodecsSupported);
    console.log('🎤 錄音方式:', browser.recordingMethod);
    console.log('📊 WebCodecs 詳細支援:', webCodecs);
  });

  // 開始錄音
  const startRecording = async () => {
    console.log('🎤 開始 Speech Ear 語音錄音...');

    try {
      setIsRecording(true);
      setIsActive(true);
      setPreviewText('🎤 自主語音識別中...');

      // 啟動動態文字效果
      startDynamicTextEffect();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const trackSettings = audioTrack.getSettings();
        console.log('🔍 音頻配置:', trackSettings);
      }

      const browser = detectBrowser();

      if (!browser.isSupported) {
        throw new Error(`瀏覽器 ${browser.name} 不支援音頻格式 ${browser.mimeType}`);
      }

      if (browser.recordingMethod === 'webcodecs' && browser.webCodecsSupported) {
        console.log('🚀 使用 WebCodecs 硬體加速錄音');
        await startWebCodecsRecording(stream);
      } else {
        console.log('📼 使用 MediaRecorder 相容模式錄音');
        await startMediaRecorderRecording(stream);
      }

      recordingStartTime = Date.now();

    } catch (err) {
      console.error('❌ Speech Ear 錄音失敗:', err);
      setPreviewText('❌ 需要麥克風權限');
      setIsRecording(false);
      setTimeout(() => setIsActive(false), 2000);
    }
  };

  // WebCodecs 錄音實現
  const startWebCodecsRecording = async (stream: MediaStream) => {
    console.log('🚀 啟動 WebCodecs 硬體加速錄音');

    audioPackets = [];

    try {
      audioEncoder = new AudioEncoder({
        output: (chunk, metadata) => {
          console.log(`🎵 WebCodecs 包輸出: ${chunk.byteLength} bytes`);
          const packetData = new Uint8Array(chunk.byteLength);
          chunk.copyTo(packetData);
          audioPackets.push(packetData);
        },
        error: (error) => {
          console.error('🚨 WebCodecs 編碼錯誤:', error);
          setPreviewText(`❌ 編碼失敗: ${error.message}`);
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
        setPreviewText(`❌ 音頻處理失敗: ${err.message}`);
      });

      console.log('✅ WebCodecs 錄音已啟動');

    } catch (error) {
      console.error('🚨 WebCodecs 初始化失敗:', error);
      setPreviewText(`❌ WebCodecs 初始化失敗: ${error.message}`);
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
    console.log('✅ MediaRecorder 錄音已啟動');
  };

  // 停止錄音
  const stopRecording = () => {
    console.log('🛑 停止 Speech Ear 語音識別...');

    setIsRecording(false);

    // 停止動態文字效果
    stopDynamicTextEffect();

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
          console.log(`✅ WebCodecs 錄音完成 - 包數量: ${audioPackets.length}, JSON 大小: ${jsonBlob.size} bytes`);
          transcribeAudio(jsonBlob);
        } else {
          console.warn('⚠️ WebCodecs 錄音沒有收集到音頻包');
          setPreviewText('❌ 錄音失敗：沒有音頻數據');
        }

      } catch (error) {
        console.error('🚨 WebCodecs 停止錄音時出錯:', error);
        setPreviewText('❌ 停止錄音時發生錯誤');
      }

    } else if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('🛑 停止 MediaRecorder 錄音');
      mediaRecorder.stop();
    }

    setIsProcessing(true);
    setTimeout(() => setIsActive(false), 2000);
  };

  // Speech Ear API 語音轉文字
  const transcribeAudio = async (audioBlob: Blob) => {
    console.log('🎯 Speech Ear 語音轉文字...');
    try {
      const recordingDuration = Date.now() - recordingStartTime;
      console.log('⏱️ 錄音時長:', recordingDuration, 'ms');

      if (recordingDuration < 500) {
        setPreviewText('❌ 錄音時間太短');
        return;
      }

      if (audioBlob.size < 100) {
        setPreviewText('❌ 音頻數據太小');
        return;
      }

      const formData = new FormData();
      const browser = detectBrowser();

      if (audioBlob.type === 'application/json' && browser.recordingMethod === 'webcodecs') {
        const fileName = 'webcodecs-packets.json';
        formData.append('audio_packets', audioBlob, fileName);
        console.log(`🚀 WebCodecs 獨立包上傳 - ${fileName}, ${audioBlob.size} bytes`);
      } else {
        const fileName = `recording.${browser.ext}`;
        formData.append('audio', audioBlob, fileName);
        console.log(`📼 MediaRecorder 上傳 - ${fileName}, ${audioBlob.size} bytes`);
      }

      const speechEarUrl = import.meta.env.VITE_SPEECH_EAR_URL || 'http://localhost:3001';
      console.log('🌐 Speech Ear URL:', speechEarUrl);

      const response = await fetch(`${speechEarUrl}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🚨 Speech Ear API 錯誤:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Speech Ear 語音轉文字結果:', result);

      const transcription = result.transcript || result.full_transcript || result.text;
      if (transcription && transcription.trim()) {
        const finalTranscription = transcription.trim();
        setPreviewText(`💬 ${finalTranscription}`);

        await processVoiceCommand(finalTranscription);

        console.log('🎯 語音指令:', finalTranscription);
        console.log('⚡ 處理時間:', result.processing_time_ms, 'ms');
        console.log('🎯 信心度:', result.confidence ? (result.confidence * 100).toFixed(1) + '%' : '未知');
      } else {
        setPreviewText('❌ 未能識別語音內容');
      }

    } catch (err) {
      console.error('❌ Speech Ear 語音轉文字失敗:', err);
      setPreviewText('❌ 語音處理失敗：' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 處理語音指令
  const processVoiceCommand = async (text: string) => {
    if (!text.trim()) return;

    try {
      const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.endpoints.aiChat}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: gameStore.currentPlayer?.id || 'default_player',
          message: text,
          context: 'Speech Ear 語音控制'
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.type === 'movement' && data.data?.success) {
          if (data.data.newPosition) {
            gameActions.setPlayerPosition(
              data.data.newPosition.latitude,
              data.data.newPosition.longitude
            );
          }

          if (props.onMovementResponse) {
            props.onMovementResponse(data.data);
          }

          setPreviewText('✅ 移動成功！');
        } else {
          setPreviewText('❌ 指令無法執行');
        }
      }
    } catch (error) {
      console.error('Speech Ear 語音指令處理失敗:', error);
      setPreviewText('❌ 連接失敗');
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

      // 清理動態文字效果
      stopDynamicTextEffect();

      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      if (audioEncoder) {
        audioEncoder.close();
      }
    });
  });

  return (
    <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* 語音預覽氣泡 */}
      {(isActive() && (previewText() || dynamicText())) && (
        <div class="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* 動態文字效果 - 錄音時顯示 */}
          {isRecording() && dynamicText() ? (
            <div class="animate-pulse">
              {dynamicText()}
            </div>
          ) : (
            previewText()
          )}
        </div>
      )}

      {/* Speech Ear 語音球 */}
      <div class="relative">
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          class={`group relative w-16 h-16 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 ${
            isRecording()
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl animate-pulse'
              : isProcessing()
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl'
              : 'bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg hover:shadow-xl'
          }`}
          style={{
            "backdrop-filter": "blur(20px)",
            "border": "1px solid rgba(255, 255, 255, 0.2)"
          }}
        >
          {/* 動態波紋效果 */}
          {isRecording() && (
            <>
              <div class="absolute inset-0 rounded-full bg-green-500/30 animate-ping"></div>
              <div class="absolute inset-0 rounded-full bg-green-500/20 animate-ping animation-delay-75"></div>
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
              <div class="flex flex-col items-center">
                <svg
                  class={`w-6 h-6 text-white transition-transform duration-300 ${isRecording() ? 'scale-125' : 'group-hover:scale-110'}`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                <div class="text-xs text-white mt-1 font-semibold">🏠</div>
              </div>
            )}
          </div>

          {/* 玻璃反光效果 */}
          <div class="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>

        {/* 操作提示 */}
        {!isActive() && (
          <div class="absolute -bottom-8 right-0 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Speech Ear 語音 / 空格鍵
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeechEarVoiceOrb;