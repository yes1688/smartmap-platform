# API 文檔

> 📅 最後更新：2025-10-06
>
> ⚠️ 本文檔僅列出實際實現的 API 端點

## REST API 端點

### 🎮 遊戲相關
```
GET    /api/v1/game/status       # 取得玩家遊戲狀態（需要 playerId 參數）
GET    /api/v1/game/players      # 取得所有玩家
GET    /api/v1/game/sessions     # 取得所有遊戲會話
POST   /api/v1/game/sessions     # 創建新遊戲會話
POST   /api/v1/game/collect      # 收集物品
POST   /api/v1/game/move         # 移動玩家（有速率限制）
```

### 🗺️ 地理位置
```
GET    /api/v1/locations         # 取得所有位置
POST   /api/v1/locations         # 新增位置
GET    /api/v1/historical-sites  # 取得歷史景點
POST   /api/v1/places/search     # Google Places API 搜尋（有速率限制）
```

### 🤖 AI 和語音
```
POST   /api/v1/voice/process     # 處理語音輸入（有速率限制）
POST   /api/v1/voice/command     # 統一語音指令處理器（有速率限制）
POST   /api/v1/ai/chat           # AI 對話，可自動處理移動指令（有速率限制）
```

### 🔧 除錯（嚴格速率限制）
```
POST   /api/v1/debug/movement    # 除錯移動功能
```

### 🏥 系統
```
GET    /health                   # 健康檢查
```

## WebSocket 事件

### 玩家移動
```javascript
{
  type: "player_move",
  data: { lat: 25.0330, lng: 121.5654 }
}
```

### 物品收集
```javascript
{
  type: "item_collected",
  data: { itemId: "item_123", score: 50 }
}
```

### 語音指令
```javascript
{
  type: "voice_command",
  data: { command: "移動到台北101", result: "success" }
}
```

### 聊天訊息
```javascript
{
  type: "chat_message",
  data: { message: "你好", sender: "user" }
}
```