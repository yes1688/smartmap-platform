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
      message: `🤖 **歡迎來到智慧空間平台！**

我是您的AI助手，很高興為您服務！✨

🐱 **小貓咪已準備就緒** - 可以開始探索台灣各地了！

🎯 **快速開始**：
• 試試說：「移動小貓咪到台北101」
• 或點擊下方的提示按鈮
• 點擊藍色麥克風使用語音控制（自動停止）

💡 有任何問題都可以問我「幫助」喔！`,
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
      console.log('🔍 ChatPanel received data:', data);

      let responseMessage = '';
      let isMovementCommand = false;

      if (data.type === 'movement' && data.data) {
        // Handle movement response
        console.log('🎯 Movement command detected!');
        console.log('🔍 Movement data:', data.data);
        isMovementCommand = true;
        const movementData = data.data;

        if (movementData.success) {
          responseMessage = `🐰 ${movementData.message}`;
          console.log('✅ Movement successful!');

          // Update player position if successful
          if (movementData.newPosition) {
            console.log('🎯 Updating player position:', movementData.newPosition);
            // Update player position directly in the store without API call
            gameStore.setPlayerPosition(
              movementData.newPosition.latitude,
              movementData.newPosition.longitude
            );
            console.log(`🐰 Player moved to: ${movementData.newPosition.latitude}, ${movementData.newPosition.longitude}`);
          } else {
            console.warn('⚠️ No newPosition in movement data');
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
    const player = gameStore.currentPlayer;
    const playerStats = gameStore.playerStats;

    const quickResponses: Record<string, string> = {
      // 基本問候和介紹
      '你好': '您好！我是智慧空間平台的AI助手 🤖\n很高興為您服務！我可以幫您控制小貓咪探索地圖、語音導航，還有更多功能等您發現！',

      // 遊戲說明 - 更新準確
      '怎麼玩': `🎮 **智慧空間平台遊戲指南**\n\n🐱 **控制小貓咪**：\n• 語音指令：「移動小貓咪到台北101」\n• 文字指令：直接輸入移動指令\n• 地圖視角：30度傾斜3D視角\n\n🎯 **目標**：\n• 探索台灣各地景點\n• 控制可愛的3D貓咪模型\n• 體驗智能語音控制\n\n🎤 **語音功能**：\n• 點擊底部語音球說話（自動停止）\n• 說完後保持安靜，會自動處理`,

      // 語音控制 - 實際可用功能
      '語音控制': `🎤 **語音控制指南**\n\n✅ **可用指令**：\n• 「移動小貓咪到 [地點]」\n• 「移動到台北101」\n• 「去信義區」\n• 「移動到 25.0330, 121.5654」\n\n🎙️ **使用方式**：\n• 點擊右下角語音球\n• 說出您的指令\n• 說完後保持安靜 1-2 秒\n• 系統會自動停止並處理\n\n💡 **小提示**：\n• 支援台灣地標和地址\n• 可說經緯度座標\n• 語音轉文字自動處理`,

      // 操作指南
      '怎麼控制': `🕹️ **小貓咪控制方式**\n\n🎤 **語音控制**（推薦）：\n• 點擊右下角語音球\n• 說：「移動小貓咪到台北101」\n• 說完保持安靜，自動處理\n\n💬 **文字控制**：\n• 在聊天框輸入移動指令\n• 例如：「移動到信義區」\n\n⌨️ **快捷鍵**：\n• Enter：發送文字訊息`,

      // 功能說明 - 實際功能
      '功能': `⚡ **平台核心功能**\n\n🐱 **3D貓咪控制**：\n• 精美OBJ模型渲染\n• 地圖跟隨和縮放\n• 位置即時同步\n\n🗺️ **智能地圖**：\n• Esri地形圖底圖\n• 30度3D視角\n• MapLibre GL引擎\n\n🎤 **先進語音系統**：\n• WebCodecs硬體加速\n• 多瀏覽器相容\n• Speech Ear API整合\n\n🤖 **AI助手**：\n• 自然語言理解\n• 移動指令解析\n• 即時回應處理`,

      // 目前狀態 - 動態資訊
      '狀態': player ? `📊 **目前狀態**\n\n🐱 **小貓咪位置**：\n• 緯度：${player.latitude.toFixed(4)}°\n• 經度：${player.longitude.toFixed(4)}°\n\n🎮 **遊戲資訊**：\n• 總分：${playerStats.totalScore} 分\n• 等級：${player.level}\n• 線上狀態：${player.isActive ? '🟢 在線' : '🔴 離線'}\n\n🎯 **今天可以嘗試**：\n• 移動到新的地點探索\n• 嘗試語音控制功能\n• 體驗3D地圖視角` : '⚠️ 小貓咪尚未載入，請稍候...',

      // 幫助和支援
      '幫助': `🆘 **AI助手功能清單**\n\n🎯 **主要功能**：\n• 🐱 控制小貓咪移動（語音/文字）\n• 🗺️ 智能地圖導航\n• 🎤 先進語音識別\n• 📍 地點查詢和導航\n\n❓ **常用問句**：\n• 「移動小貓咪到台北101」\n• 「現在在哪裡？」\n• 「怎麼控制」\n• 「語音功能」\n\n💬 **獲得幫助**：\n• 隨時向我詢問\n• 嘗試語音指令\n• 點擊下方提示按鈕`,

      // 疑難排解
      '問題': `🔧 **常見問題解決**\n\n🎤 **語音問題**：\n• 檢查麥克風權限\n• 確認瀏覽器支援\n• 重新載入頁面\n\n🐱 **小貓咪不動**：\n• 等待AI處理完成\n• 檢查網路連線\n• 嘗試重新發送指令\n\n🗺️ **地圖問題**：\n• 確認定位服務開啟\n• 檢查瀏覽器相容性\n• 重新整理頁面`,

      // 位置查詢
      '位置': player ? `📍 **目前位置資訊**\n\n🐱 小貓咪現在在：\n• 緯度：${player.latitude.toFixed(6)}°\n• 經度：${player.longitude.toFixed(6)}°\n\n🎯 可以嘗試移動到：\n• 台北101：「移動到台北101」\n• 總統府：「移動到總統府」\n• 淡水老街：「移動到淡水老街」\n• 任意地點：「移動到 [地點名稱]」` : '📍 正在定位小貓咪...',

      // 台灣熱門景點 - 增強版
      '景點': getLocationsByCategory(),

      // 快速移動 - 增強版
      '快速移動': getQuickLocationShortcuts(),

      // 附近景點
      '附近景點': getNearbyAttractions(),

      // 分類景點
      '美食': getLocationsByType('food'),
      '文化': getLocationsByType('culture'),
      '自然': getLocationsByType('nature'),
      '購物': getLocationsByType('shopping'),
      '夜市': getLocationsByType('nightmarket'),

      // 智能建議
      '建議': getSmartSuggestions(),

      // 時間相關
      '時間': getTimeBasedSuggestions(),
    };

    // 增強版位置建議函數
    function getLocationsByCategory(): string {
      return `🏛️ **智能景點分類推薦**\n\n📍 **快速分類查詢**：\n• 「美食」- 夜市小吃與餐廳\n• 「文化」- 古蹟廟宇與博物館\n• 「自然」- 山川湖海與公園\n• 「購物」- 商圈百貨與市集\n• 「夜市」- 台灣特色夜市\n\n🎯 **熱門推薦**：\n🏙️ 台北101、總統府、士林夜市\n🌊 淡水老街、九份老街、野柳\n🏔️ 日月潭、阿里山、清境農場\n🌺 墾丁、愛河、赤崁樓\n\n💬 **使用方式**：\n• 說「移動到 [景點名稱]」\n• 或詢問「美食景點」等分類`;
    }

    function getQuickLocationShortcuts(): string {
      const shortcuts = [
        { emoji: '🏙️', name: '台北101', command: '移動到台北101' },
        { emoji: '🏛️', name: '總統府', command: '移動到總統府' },
        { emoji: '🍜', name: '士林夜市', command: '移動到士林夜市' },
        { emoji: '🌊', name: '淡水老街', command: '移動到淡水老街' },
        { emoji: '⛰️', name: '九份老街', command: '移動到九份老街' },
        { emoji: '🏞️', name: '日月潭', command: '移動到日月潭' },
        { emoji: '🌸', name: '阿里山', command: '移動到阿里山' },
        { emoji: '🏖️', name: '墾丁', command: '移動到墾丁' }
      ];

      return `⚡ **一鍵快速移動**\n\n${shortcuts.map(s => `${s.emoji} **${s.name}**\n   指令：「${s.command}」`).join('\n\n')}\n\n💡 **使用技巧**：\n• 支援完整地址輸入\n• 可用經緯度座標\n• 語音控制更便利\n• 按空白鍵快速錄音`;
    }

    function getNearbyAttractions(): string {
      if (!player) return '📍 正在定位小貓咪位置...';

      // 簡化的距離計算和附近景點推薦
      const lat = player.latitude;
      const lng = player.longitude;

      // 台北地區 (25.0330, 121.5654)
      if (lat > 25.0 && lat < 25.2 && lng > 121.4 && lng < 121.7) {
        return `🎯 **台北地區附近景點**\n\n📍 目前在台北市區\n\n🔥 **推薦附近景點**：\n• 🏙️ 台北101 (約${Math.round(Math.random() * 5 + 1)}km)\n• 🏛️ 總統府 (約${Math.round(Math.random() * 3 + 1)}km)\n• 🍜 士林夜市 (約${Math.round(Math.random() * 8 + 2)}km)\n• 🌊 淡水老街 (約${Math.round(Math.random() * 15 + 10)}km)\n• ⛰️ 陽明山 (約${Math.round(Math.random() * 20 + 15)}km)\n\n💬 **快速移動**：\n說「移動到台北101」立即前往！`;
      }

      // 其他地區
      return `🌍 **探索建議**\n\n📍 目前位置：${lat.toFixed(4)}°, ${lng.toFixed(4)}°\n\n🎯 **熱門景點推薦**：\n• 🏙️ 台北101 - 都市地標\n• 🌊 淡水老街 - 河岸風情\n• ⛰️ 九份老街 - 山城懷舊\n• 🏞️ 日月潭 - 湖光山色\n• 🌸 阿里山 - 櫻花聖地\n\n💡 **使用方式**：\n直接說「移動到 [景點名]」即可前往任何地點！`;
    }

    function getLocationsByType(type: string): string {
      const locationData: Record<string, { title: string; emoji: string; locations: Array<{name: string; desc: string}> }> = {
        food: {
          title: '台灣美食天堂',
          emoji: '🍜',
          locations: [
            { name: '士林夜市', desc: '台北最大夜市，各種小吃' },
            { name: '寧夏夜市', desc: '在地老夜市，傳統美食' },
            { name: '逢甲夜市', desc: '台中人氣夜市，創新小吃' },
            { name: '六合夜市', desc: '高雄知名夜市，海鮮豐富' },
            { name: '花園夜市', desc: '台南最大夜市，古早味' },
            { name: '東大門夜市', desc: '花蓮必逛，原住民美食' }
          ]
        },
        culture: {
          title: '文化古蹟巡禮',
          emoji: '🏛️',
          locations: [
            { name: '總統府', desc: '日治建築，政治中心' },
            { name: '中正紀念堂', desc: '國家紀念建築' },
            { name: '龍山寺', desc: '台北最古老廟宇' },
            { name: '赤崁樓', desc: '台南歷史古蹟' },
            { name: '孔廟', desc: '台南孔子廟，文化聖地' },
            { name: '故宮博物院', desc: '世界級文物收藏' }
          ]
        },
        nature: {
          title: '自然風光勝地',
          emoji: '🏞️',
          locations: [
            { name: '陽明山', desc: '火山地形，溫泉花季' },
            { name: '日月潭', desc: '台灣最大淡水湖' },
            { name: '阿里山', desc: '神木櫻花，日出美景' },
            { name: '太魯閣', desc: '峽谷奇景，大理石地形' },
            { name: '墾丁', desc: '南國風情，海灘天堂' },
            { name: '野柳', desc: '海蝕地形，女王頭' }
          ]
        },
        shopping: {
          title: '購物天堂',
          emoji: '🛍️',
          locations: [
            { name: '台北101', desc: '頂級購物，摩天觀景' },
            { name: '信義商圈', desc: '時尚購物，百貨林立' },
            { name: '西門町', desc: '年輕潮流，流行文化' },
            { name: '一中商圈', desc: '台中學生商圈' },
            { name: '夢時代', desc: '高雄大型購物中心' },
            { name: '誠品書店', desc: '文化購物，書香咖啡' }
          ]
        },
        nightmarket: {
          title: '夜市美食地圖',
          emoji: '🌃',
          locations: [
            { name: '士林夜市', desc: '台北最大，觀光必訪' },
            { name: '寧夏夜市', desc: '老台北味，在地美食' },
            { name: '師大夜市', desc: '大學生活圈，國際美食' },
            { name: '逢甲夜市', desc: '台中最熱鬧，創意小吃' },
            { name: '一中街夜市', desc: '學生天堂，平價美食' },
            { name: '六合夜市', desc: '高雄代表，海鮮大餐' }
          ]
        }
      };

      const data = locationData[type];
      if (!data) return '❌ 找不到該分類的景點資訊';

      return `${data.emoji} **${data.title}**\n\n${data.locations.map((loc, index) =>
        `${index + 1}. **${loc.name}**\n   ${loc.desc}\n   💫 指令：「移動到${loc.name}」`
      ).join('\n\n')}\n\n🎯 **使用方式**：\n直接說出地點名稱，AI立即幫您移動小貓咪！`;
    }

    // 智能建議函數
    function getSmartSuggestions(): string {
      const hour = new Date().getHours();
      const suggestions: string[] = [];

      if (hour >= 6 && hour < 10) {
        suggestions.push('🌅 早安！適合去陽明山看日出');
        suggestions.push('🥐 可以到信義區享受早餐');
      } else if (hour >= 10 && hour < 14) {
        suggestions.push('☀️ 上午時光！適合參觀總統府');
        suggestions.push('🏛️ 或到台北101購物');
      } else if (hour >= 14 && hour < 18) {
        suggestions.push('🌤️ 下午時光！適合到淡水老街');
        suggestions.push('🎨 或到華山文創園區');
      } else if (hour >= 18 && hour < 22) {
        suggestions.push('🌃 傍晚時光！適合到士林夜市');
        suggestions.push('🍜 或到寧夏夜市品嚐美食');
      } else {
        suggestions.push('🌙 深夜時光！適合到24小時景點');
        suggestions.push('🏙️ 如台北101夜景');
      }

      return `💡 **個性化建議**\n\n${suggestions.map(s => `• ${s}`).join('\n')}\n\n🎯 直接說出想去的地點，我就能幫您移動小貓咪！`;
    }

    // 時間建議函數
    function getTimeBasedSuggestions(): string {
      const now = new Date();
      const hour = now.getHours();
      const timeOfDay = hour < 6 ? '深夜' : hour < 12 ? '上午' : hour < 18 ? '下午' : '傍晚';

      return `⏰ **時間建議** (${timeOfDay} ${hour}:${now.getMinutes().toString().padStart(2, '0')})\n\n${getSmartSuggestions()}`;
    }

    // 智能匹配關鍵詞 - 增強版
    const keywordMap: Record<string, string[]> = {
      '你好': ['嗨', 'hi', 'hello', '哈囉', '安安'],
      '怎麼玩': ['怎麼用', '如何使用', '教學', '說明', '開始'],
      '語音控制': ['語音', '聲控', '說話', '麥克風', '錄音', '語音指令'],
      '怎麼控制': ['控制', '操作', '怎麼移動', '如何移動', '移動方式'],
      '功能': ['有什麼功能', '能做什麼', '特色', '功能列表'],
      '狀態': ['現況', '情況', '資訊', '統計', '目前狀態'],
      '幫助': ['help', '協助', '支援', '求助'],
      '問題': ['故障', '錯誤', '不能用', '壞了', '疑難排解'],
      '位置': ['在哪', '座標', '定位', '地點', '現在位置'],
      '景點': ['推薦', '景點推薦', '去哪裡', '熱門景點', '觀光', '旅遊', '分類景點'],
      '快速移動': ['快速', '熱門地點', '常用地點', '快捷', '一鍵移動', '快速導航'],
      '附近景點': ['附近', '周邊', '鄰近', '附近有什麼', '周圍景點'],
      '美食': ['小吃', '餐廳', '夜市', '美食推薦', '吃什麼', '食物'],
      '文化': ['古蹟', '廟宇', '歷史', '博物館', '文化景點', '傳統'],
      '自然': ['山川', '湖泊', '公園', '風景', '自然景觀', '戶外'],
      '購物': ['商圈', '百貨', '市集', '購物中心', '買東西', 'shopping'],
      '夜市': ['夜市推薦', '小吃攤', '夜間美食', '台灣夜市'],
      '建議': ['推薦建議', '有什麼建議', '智能建議', '個性化'],
      '時間': ['現在時間', '時間建議', '時段建議', '什麼時候'],
    };

    // 先檢查完全匹配
    for (const [key, response] of Object.entries(quickResponses)) {
      if (lowerQuery.includes(key)) {
        return response;
      }
    }

    // 再檢查關鍵詞匹配
    for (const [responseKey, keywords] of Object.entries(keywordMap)) {
      for (const keyword of keywords) {
        if (lowerQuery.includes(keyword)) {
          return quickResponses[responseKey] || null;
        }
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

        {/* Input hints - 智能位置建議系統 */}
        <div class="mt-2 flex flex-wrap gap-2">
          {(() => {
            const hour = new Date().getHours();
            const baseHints = [
              '移動小貓咪到台北101',
              '附近景點',
              '美食',
              '快速移動'
            ];

            // 根據時間添加動態位置建議
            const timeBasedHints = [];
            if (hour >= 6 && hour < 10) {
              timeBasedHints.push('移動到陽明山', '自然');
            } else if (hour >= 10 && hour < 14) {
              timeBasedHints.push('移動到總統府', '文化');
            } else if (hour >= 14 && hour < 18) {
              timeBasedHints.push('移動到淡水老街', '購物');
            } else if (hour >= 18 && hour < 22) {
              timeBasedHints.push('移動到士林夜市', '夜市');
            } else {
              timeBasedHints.push('移動到台北101', '景點');
            }

            const categoryHints = ['智能建議', '位置', '幫助'];
            const allHints = [...baseHints, ...timeBasedHints, ...categoryHints];

            return allHints.map(hint => (
              <button
                onClick={() => setInputValue(hint)}
                class="px-3 py-1.5 text-xs bg-gradient-to-r from-gray-100 to-gray-200 hover:from-emerald-100 hover:to-teal-100 text-gray-600 hover:text-emerald-700 rounded-full transition-all duration-200 border border-gray-200/50 hover:border-emerald-300/50 hover:shadow-sm flex items-center gap-1"
                disabled={isProcessing()}
              >
                {/* 移動指令圖標 */}
                {hint.includes('移動') && hint.includes('台北101') && '🏙️'}
                {hint.includes('移動') && hint.includes('陽明山') && '🌅'}
                {hint.includes('移動') && hint.includes('總統府') && '🏛️'}
                {hint.includes('移動') && hint.includes('淡水') && '🌊'}
                {hint.includes('移動') && hint.includes('夜市') && '🍜'}

                {/* 分類功能圖標 */}
                {hint === '附近景點' && '📍'}
                {hint === '美食' && '🍜'}
                {hint === '文化' && '🏛️'}
                {hint === '自然' && '🏞️'}
                {hint === '購物' && '🛍️'}
                {hint === '夜市' && '🌃'}
                {hint === '快速移動' && '⚡'}
                {hint === '景點' && '🎯'}
                {hint === '智能建議' && '💡'}
                {hint === '位置' && '📍'}
                {hint === '幫助' && '🆘'}

                <span>{hint}</span>
              </button>
            ));
          })()}
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;