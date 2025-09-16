# API 文檔

## REST API 端點

### 遊戲相關
```
GET    /api/v1/game/status       # 取得遊戲狀態
POST   /api/v1/game/collect      # 收集物品
POST   /api/v1/game/move         # 移動玩家
```

### 地理位置
```
GET    /api/v1/locations         # 取得所有位置
POST   /api/v1/locations         # 新增位置
GET    /api/v1/historical-sites  # 取得歷史景點
```

### AI 和語音
```
POST   /api/v1/voice/process     # 處理語音輸入
POST   /api/v1/ai/chat          # AI 對話
POST   /api/v1/ai/movement       # AI 控制移動
POST   /api/v1/ai/chat-movement  # 對話加移動
GET    /api/v1/ai/movement-stats # 移動統計
```

### 系統
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