import { Component, createSignal, onCleanup } from 'solid-js';
import { gameStore, setCurrentPlayer } from '@/stores/gameStore';

interface VoiceControlProps {
  onVoiceCommand: (text: string) => void;
}

const VoiceControl: Component<VoiceControlProps> = (props) => {
  const [isRecording, setIsRecording] = createSignal(false);
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [lastTranscription, setLastTranscription] = createSignal('');
  const [error, setError] = createSignal('');

  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let recordingStartTime: number = 0;

  // 開始錄音
  const startRecording = async () => {
    try {
      setError('');

      // 請求麥克風權限 - 配置匹配 Speech Ear API
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000, // 修復：使用 48kHz 匹配 Speech Ear API
          channelCount: 1,   // 單聲道
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

      // 頂級方式：直接使用最穩定的 OGG-OPUS 格式
      // 根據實際 API 測試，強制使用 OGG-OPUS 避免 WebM-OPUS 相容性問題
      let mimeType = 'audio/ogg;codecs=opus'; // 業界標準，API 完全支援
      let fileName = 'recording.ogg';

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Chrome/Edge fallback to WebM-OPUS (如果 OGG 不支援)
        mimeType = 'audio/webm;codecs=opus';
        fileName = 'recording.webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          // 最後手段：WAV
          mimeType = 'audio/wav';
          fileName = 'recording.wav';
        }
      }

      console.log(`🎵 使用格式: ${mimeType}`);

      mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 64000 // 優化位元率
      });

      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        stream.getTracks().forEach(track => track.stop());

        // 傳送到語音助手 API
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start(100); // 每100ms收集一次數據，提高響應速度
      recordingStartTime = Date.now();
      setIsRecording(true);
      console.log('🎤 開始錄音，格式:', mimeType);

    } catch (err) {
      console.error('❌ 錄音失敗:', err);
      setError('無法存取麥克風，請檢查權限設定');
    }
  };

  // 停止錄音
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsProcessing(true);
      console.log('🛑 停止錄音');
    }
  };

  // 語音轉文字
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      // 檢查錄音時間和大小
      const recordingDuration = Date.now() - recordingStartTime;
      console.log('⏱️ 錄音時長:', recordingDuration, 'ms');

      if (recordingDuration < 500) {
        setError('錄音時間太短，請至少說話 0.5 秒');
        return;
      }

      if (audioBlob.size < 1000) {
        setError('音頻數據太小，請重新錄音');
        return;
      }

      const formData = new FormData();
      // 使用 Care Voice 的簡化方式 - 只發送音頻檔案
      // 根據實際格式設置檔案名稱
      let fileName = 'recording.ogg'; // 預設
      if (audioBlob.type.includes('webm')) fileName = 'recording.webm';
      else if (audioBlob.type.includes('ogg')) fileName = 'recording.ogg';
      else if (audioBlob.type.includes('wav')) fileName = 'recording.wav';
      else if (audioBlob.type.includes('mp4')) fileName = 'recording.mp4';

      formData.append('audio', audioBlob, fileName);

      console.log('🔄 傳送音頻到 Speech Ear API...');
      console.log('📁 音頻大小:', (audioBlob.size / 1024).toFixed(2), 'KB');
      console.log('🎵 音頻類型:', audioBlob.type);
      console.log('📄 檔案名稱:', fileName);
      console.log('📊 音頻 chunks 數量:', audioChunks.length);

      const speechEarUrl = import.meta.env.VITE_SPEECH_EAR_URL || 'http://localhost:3001';
      console.log('🌐 Speech Ear URL:', speechEarUrl);
      console.log('🔧 Environment variable:', import.meta.env.VITE_SPEECH_EAR_URL);
      const response = await fetch(`${speechEarUrl}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
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