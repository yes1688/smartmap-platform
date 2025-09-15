import { Component, createSignal, For, Show, createEffect, onMount } from 'solid-js';
import type { ChatMessage } from '@/types';
import { CONFIG } from '@/config';
import { gameStore } from '@/stores/gameStore';

interface ChatPanelProps {
  onClose: () => void;
  onMovementResponse?: (result: any) => void;
}

const ChatPanel: Component<ChatPanelProps> = (props) => {
  let messagesContainer: HTMLDivElement | undefined;

  const [messages, setMessages] = createSignal<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      message: '您好！我是智慧空間平台的AI助手，很高興為您服務！有什麼我可以幫助您的嗎？',
      timestamp: Date.now() - 5000,
    },
  ]);

  const [inputValue, setInputValue] = createSignal('');
  const [isProcessing, setIsProcessing] = createSignal(false);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    if (messagesContainer) {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Watch for messages changes and auto-scroll
  createEffect(() => {
    messages(); // Subscribe to messages changes
    setTimeout(scrollToBottom, 100); // Small delay to ensure DOM update
  });

  // Initial scroll on mount
  onMount(() => {
    setTimeout(scrollToBottom, 100);
  });

  const handleSendMessage = async () => {
    const message = inputValue().trim();
    if (!message || isProcessing()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      // Use the regular chat endpoint with movement integration
      const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.endpoints.aiChat}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: gameStore.player?.id || 'default_player',
          message: message,
          context: '智慧空間平台遊戲助手'
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      let responseMessage = '';
      let isMovementCommand = false;

      if (data.type === 'movement' && data.data) {
        // Handle movement response
        isMovementCommand = true;
        const movementData = data.data;

        if (movementData.success) {
          responseMessage = `🐰 ${movementData.message}`;

          // Update player position if successful
          if (movementData.newPosition) {
            // Update player position directly in the store without API call
            gameStore.setPlayerPosition(
              movementData.newPosition.latitude,
              movementData.newPosition.longitude
            );
            console.log(`🐰 Player moved to: ${movementData.newPosition.latitude}, ${movementData.newPosition.longitude}`);
          }

          // Notify parent component about movement
          if (props.onMovementResponse) {
            props.onMovementResponse(movementData);
          }
        } else {
          responseMessage = `❌ ${movementData.message}`;
          if (movementData.rateLimited) {
            responseMessage += '\n請稍後再試。';
          }
        }
      } else {
        // Handle regular chat response
        responseMessage = data.response || data.data?.message || '抱歉，我無法回應您的問題。';
      }

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        message: responseMessage,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Fallback to quick response if API fails
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        message: getQuickResponse(message) || '抱歉，我現在無法連接到AI服務。請稍後再試。',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getQuickResponse = (query: string): string | null => {
    const lowerQuery = query.toLowerCase();

    const quickResponses: Record<string, string> = {
      '你好': '您好！我是智慧空間平台的AI助手，很高興為您服務！有什麼我可以幫助您的嗎？',
      '怎麼玩': '這是一個結合3D地圖和收集遊戲的平台！您可以：\n• 在地圖上移動探索\n• 收集散落的物品獲得分數\n• 發現歷史景點聆聽介紹\n• 使用語音控制與我對話',
      '語音控制': '您可以使用以下語音指令：\n• "導航到..." - 地圖導航\n• "收集附近物品" - 自動收集\n• "介紹這個地方" - 獲取景點資訊\n• "我的分數" - 查看遊戲狀態',
      '分數': '您可以透過以下方式獲得分數：\n• 收集地圖上的物品（10-100分）\n• 發現歷史景點（25分）\n• 完成特殊任務',
      '幫助': '我可以協助您：\n• 🗺️ 地圖導航和位置查詢\n• 🎮 遊戲規則和策略建議\n• 🏛️ 歷史景點介紹和文化知識\n• 🎤 語音控制指導\n• 📊 遊戲統計和進度追蹤',
    };

    for (const [key, response] of Object.entries(quickResponses)) {
      if (lowerQuery.includes(key)) {
        return response;
      }
    }

    return null;
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div class="absolute top-5 left-5 w-96 max-w-[90vw] h-[500px] bg-gradient-to-br from-white/95 via-slate-50/95 to-gray-100/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 z-10 flex flex-col overflow-hidden">
      {/* Decorative Elements */}
      <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-blue-500/5 to-purple-500/5 rounded-2xl"></div>
      <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 rounded-t-2xl"></div>

      {/* Panel Header */}
      <div class="relative p-4 border-b border-gradient-to-r from-gray-200/50 to-gray-300/50 bg-gradient-to-r from-emerald-50/80 via-teal-50/80 to-blue-50/80 rounded-t-2xl">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="relative">
              <div class="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <span class="text-white text-lg">🤖</span>
              </div>
              <div class="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-sm">
                <div class="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </div>
            <div>
              <h3 class="font-bold text-gray-800 text-lg">AI 智能助手</h3>
              <p class="text-xs text-gray-500 font-medium">隨時為您服務</p>
            </div>
          </div>
          <button
            onClick={props.onClose}
            class="group relative w-8 h-8 bg-gradient-to-br from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 text-red-600 hover:text-red-700 transition-all duration-300 rounded-lg shadow-sm hover:shadow-md active:scale-95"
          >
            <span class="text-lg font-bold transition-transform duration-300 group-hover:scale-110">×</span>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainer} class="relative flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <For each={messages()}>
          {(message) => (
            <div class={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div class={`relative group max-w-[85%] ${message.sender === 'user' ? 'order-1' : 'order-2'}`}>
                {message.sender === 'ai' && (
                  <div class="absolute -left-3 top-0 w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-sm">
                    <span class="text-white text-xs">🤖</span>
                  </div>
                )}
                <div
                  class={`relative p-4 shadow-lg transition-all duration-300 group-hover:shadow-xl ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl rounded-br-md ml-3'
                      : 'bg-gradient-to-br from-white to-gray-50 text-gray-800 rounded-2xl rounded-bl-md border border-gray-200/50 ml-3'
                  }`}
                >
                  <div class="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.message}
                  </div>
                  <div class={`text-xs mt-2 flex justify-end ${
                    message.sender === 'user'
                      ? 'text-indigo-100/80'
                      : 'text-gray-400'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>

                  {/* Message tail */}
                  <div class={`absolute ${
                    message.sender === 'user'
                      ? 'bottom-2 -right-2 w-4 h-4 bg-gradient-to-br from-indigo-500 to-purple-600 transform rotate-45'
                      : 'bottom-2 -left-2 w-4 h-4 bg-gradient-to-br from-white to-gray-50 border-l border-b border-gray-200/50 transform rotate-45'
                  }`}></div>
                </div>
              </div>
            </div>
          )}
        </For>

        <Show when={isProcessing()}>
          <div class="flex justify-start animate-fadeIn">
            <div class="relative ml-3">
              <div class="absolute -left-3 top-0 w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-sm">
                <span class="text-white text-xs">🤖</span>
              </div>
              <div class="bg-gradient-to-br from-white to-gray-50 text-gray-800 rounded-2xl rounded-bl-md p-4 max-w-[85%] shadow-lg border border-gray-200/50">
                <div class="flex items-center gap-3">
                  <div class="flex space-x-1">
                    <div class="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                    <div class="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                  </div>
                  <span class="text-sm text-gray-600 font-medium">AI 正在思考...</span>
                </div>
                <div class="absolute bottom-2 -left-2 w-4 h-4 bg-gradient-to-br from-white to-gray-50 border-l border-b border-gray-200/50 transform rotate-45"></div>
              </div>
            </div>
          </div>
        </Show>
      </div>

      {/* Input Area */}
      <div class="relative p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/90 via-white/90 to-gray-50/90 backdrop-blur-sm rounded-b-2xl">
        <div class="relative flex gap-3">
          <div class="flex-1 relative">
            <textarea
              value={inputValue()}
              onInput={(e) => setInputValue(e.currentTarget.value)}
              onKeyPress={handleKeyPress}
              placeholder="輸入訊息或語音指令..."
              class="w-full px-4 py-3 pr-12 border-2 border-gray-200/50 bg-white/80 backdrop-blur-sm rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400/50 transition-all duration-300 shadow-sm hover:shadow-md text-sm leading-relaxed"
              rows="1"
              disabled={isProcessing()}
            />
            <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <span class="text-xs">💬</span>
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue().trim() || isProcessing()}
            class="group relative px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-sm active:scale-95 font-medium text-sm"
          >
            <div class="flex items-center gap-2">
              <span class={`transition-transform duration-300 ${isProcessing() ? 'animate-spin' : 'group-hover:scale-110'}`}>
                {isProcessing() ? '⏳' : '📤'}
              </span>
              <span class="hidden sm:inline">
                {isProcessing() ? '發送中' : '發送'}
              </span>
            </div>
            <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Input hints */}
        <div class="mt-2 flex flex-wrap gap-2">
          {['移動兔子到台北101', '移動到我的位置', '怎麼控制兔子', '兔子做什麼動作'].map(hint => (
            <button
              onClick={() => setInputValue(hint)}
              class="px-3 py-1.5 text-xs bg-gradient-to-r from-gray-100 to-gray-200 hover:from-emerald-100 hover:to-teal-100 text-gray-600 hover:text-emerald-700 rounded-full transition-all duration-200 border border-gray-200/50 hover:border-emerald-300/50 hover:shadow-sm"
              disabled={isProcessing()}
            >
              {hint}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;