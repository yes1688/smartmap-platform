import { Component, createSignal, onCleanup } from 'solid-js';
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

  // 按住錄音，鬆開停止
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    console.log('🖱️ 按下按鈕，當前狀態 - 錄音:', isRecording(), '處理:', isProcessing());
    if (!isRecording() && !isProcessing()) {
      console.log('🎤 開始錄音流程...');
      startRecording();
      // 添加全域監聽器確保捕獲鬆開事件
      const handleGlobalMouseUp = () => {
        console.log('🖱️ 全域鬆開事件，當前錄音狀態:', isRecording());
        if (isRecording()) {
          console.log('🛑 停止錄音流程...');
          stopRecording();
        }
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('touchend', handleGlobalMouseUp);
      };
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchend', handleGlobalMouseUp);
    }
  };

  const handleMouseUp = () => {
    if (isRecording()) {
      stopRecording();
    }
  };

  // 清理資源
  onCleanup(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  });

  return (
    <div class="fixed bottom-4 right-4 z-50">
      {/* 語音按鈕 */}
      <div class="flex flex-col items-center gap-2">

        {/* 主要錄音按鈕 */}
        <button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          disabled={isProcessing()}
          class={`
            w-16 h-16 rounded-full shadow-lg border-4 transition-all duration-200
            flex items-center justify-center
            ${isRecording()
              ? 'bg-red-500 border-red-300 scale-110 animate-pulse'
              : isProcessing()
              ? 'bg-yellow-500 border-yellow-300'
              : 'bg-blue-500 border-blue-300 hover:bg-blue-600 hover:scale-105'
            }
            ${isProcessing() ? 'cursor-wait' : 'cursor-pointer'}
          `}
        >
          {isProcessing() ? (
            <div class="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd"></path>
            </svg>
          )}
        </button>

        {/* 狀態顯示 */}
        <div class="text-center">
          {isRecording() && (
            <div class="text-red-600 text-sm font-medium animate-pulse">
              🔴 錄音中...
            </div>
          )}
          {isProcessing() && (
            <div class="text-yellow-600 text-sm font-medium">
              ⚡ 處理中...
            </div>
          )}
          {!isRecording() && !isProcessing() && (
            <div class="text-gray-600 text-sm">
              🎤 按住說話
            </div>
          )}
        </div>

        {/* 最後轉錄結果 */}
        {lastTranscription() && (
          <div class="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-xs">
            <div class="text-xs text-gray-500 mb-1">最後指令：</div>
            <div class="text-sm text-gray-800">"{lastTranscription()}"</div>
          </div>
        )}

        {/* 錯誤訊息 */}
        {error() && (
          <div class="bg-red-50/90 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-xs">
            <div class="text-xs text-red-500 mb-1">錯誤：</div>
            <div class="text-sm text-red-700">{error()}</div>
            <button
              onClick={() => setError('')}
              class="text-xs text-red-500 underline mt-1"
            >
              清除
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default VoiceControl;