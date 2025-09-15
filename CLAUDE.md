# Claude Code 工作記憶檔

## 專案概述
**專案名稱**: 智慧空間平台 (Intelligent Spatial Platform)
**技術棧**: Go + SolidJS + CesiumJS + PostgreSQL + Ollama + WebSocket
**業務領域**: 3D 地圖視覺化、AI 語音互動、遊戲化教育平台

## 當前工作狀態
**最後更新**: 2025-09-14 18:25
**主要問題**: 版面改了多次都未果

## 核心技術架構

### 後端 (Go)
- **框架**: Gin
- **資料庫**: PostgreSQL + PostGIS
- **AI 服務**: Ollama 本地 LLM
- **即時通訊**: WebSocket
- **容器化**: Podman + Podman Compose

### 前端 (SolidJS + Vite)
- **框架**: SolidJS 1.8.22
- **3D 引擎**: CesiumJS 1.111.0
- **樣式**: TailwindCSS
- **狀態管理**: SolidJS Store
- **構建工具**: Vite 5.4.0

## 專案結構
```
intelligent-spatial-platform/
├── cmd/server/main.go           # Go 應用程式入口
├── internal/                    # 核心業務邏輯
│   ├── api/                    # REST API 處理器
│   ├── ai/                     # Ollama AI 整合
│   ├── game/                   # 遊戲邏輯
│   ├── geo/                    # 地理資料處理
│   ├── voice/                  # 語音處理
│   └── websocket/              # WebSocket 處理
├── web/                        # SolidJS 前端
│   ├── src/
│   │   ├── components/         # UI 組件
│   │   ├── stores/            # 狀態管理
│   │   ├── styles/            # 樣式檔案
│   │   └── config.ts          # 配置檔案
│   ├── package.json           # 前端依賴
│   └── vite.config.ts         # Vite 配置
├── web-solid/                  # 空目錄 (僅 .vite 快取)
├── docs/                       # 文檔管理系統
└── containers/                 # 容器配置
```

## 開發環境設定

### 前端開發服務器
```bash
cd web
npm run dev
# 運行在 http://localhost:3000
```

### 後端服務器
```bash
go run cmd/server/main.go
# 運行在預設端口
```

### 容器化部署
```bash
podman-compose up -d
```

## 重要配置檔案

### web/src/config.ts
- API 基礎 URL: `${window.location.origin}/api/v1`
- CesiumJS Access Token 配置
- WebSocket 連接設定
- 遊戲參數配置

### web/vite.config.ts
- SolidJS 插件設定
- CesiumJS 靜態資源複製
- 別名配置: `@` -> `src`
- 開發服務器端口: 3000

## 核心功能模組

### 1. 3D 地圖系統 (CesiumMap.tsx)
- 基於 CesiumJS 的 3D 地球儀
- 支援衛星、地形、街道三種視圖模式
- 玩家位置追蹤和標記
- 歷史景點互動

### 2. 遊戲系統 (gameStore.ts)
- 玩家狀態管理
- 積分和等級系統
- 物品收集機制
- 會話管理

### 3. AI 對話系統
- Ollama 本地 LLM 整合
- 中文對話支援
- 歷史景點自動介紹

### 4. 語音控制系統
- Web Speech API 支援
- 繁體中文語音識別
- 常用指令模式識別

## 樣式系統

### TailwindCSS 配置
- 完整的設計系統類別
- 自定義動畫和過渡效果
- 玻璃態效果 (glass effect)
- 響應式設計

### 自定義 CSS 類別
- `.glass-effect`: 毛玻璃效果
- `.card`: 現代卡片樣式
- `.btn-*`: 按鈕變體
- 動畫類別: `.animate-fade-in`, `.animate-slide-up` 等

## API 端點
```
GET    /api/v1/locations         # 取得所有位置
POST   /api/v1/locations         # 新增位置
GET    /api/v1/historical-sites  # 取得歷史景點
POST   /api/v1/voice/process     # 處理語音輸入
POST   /api/v1/ai/chat          # AI 對話
GET    /api/v1/game/status       # 取得遊戲狀態
POST   /api/v1/game/collect      # 收集物品
POST   /api/v1/game/move         # 移動玩家
GET    /health                   # 健康檢查
```

## WebSocket 事件
```javascript
// 玩家移動
{ type: "player_move", data: { lat, lng } }

// 物品收集
{ type: "item_collected", data: { itemId, score } }

// 語音指令
{ type: "voice_command", data: { command, result } }

// 聊天訊息
{ type: "chat_message", data: { message, sender } }
```

## 常用開發指令

### 前端開發
```bash
cd web
npm run dev          # 開發服務器
npm run build        # 生產構建
npm run preview      # 預覽構建結果
npm run type-check   # TypeScript 檢查
```

### 後端開發
```bash
go run cmd/server/main.go    # 運行開發服務器
go build cmd/server/main.go  # 構建二進制檔
go test ./...                # 運行測試
go fmt ./...                 # 格式化代碼
```

### 容器操作
```bash
# 正常容器操作（建議使用）
podman-compose up -d                 # 啟動所有服務
podman-compose build                 # 重新構建映像
podman-compose up --build            # 構建並啟動
podman-compose logs -f app          # 查看應用日誌
podman-compose ps                   # 檢查服務狀態
podman-compose down                 # 停止所有服務

# 問題排除構建（僅問題時使用）
podman-compose build app --no-cache  # 強制重建應用容器（清除快取）
podman-compose up -d --build        # 構建並啟動所有服務
```

**注意**: `--no-cache` 會顯著增加構建時間，僅在以下情況使用：
- 之前構建失敗並留下問題快取
- 重要代碼修改後構建異常
- 新依賴或模組無法正確載入

## 問題排除

### 常見問題
1. **CesiumJS 地圖無法載入**: 檢查 CESIUM_ACCESS_TOKEN
2. **API 服務無回應**: 確認後端服務器運行狀態
3. **語音識別不工作**: 需要 HTTPS 或 localhost 環境
4. **容器啟動失敗**: 檢查 Podman 安裝和權限

### 除錯指令
```bash
# 檢查服務狀態
curl http://localhost:3000/health

# 查看容器狀態
podman-compose ps

# 查看詳細日誌
podman-compose logs -f [service_name]
```

## 效能優化

### 前端優化
- Vite 的 HMR (熱重載)
- CesiumJS 分塊載入
- TailwindCSS JIT 編譯
- 靜態資源快取

### 後端優化
- Go 編譯時優化
- PostgreSQL 索引優化
- WebSocket 連線管理
- 容器多階段構建

## 部署配置

### 環境變數
```env
# 前端
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_URL=ws://localhost:8080/ws
VITE_CESIUM_ACCESS_TOKEN=your_token_here

# 後端
DB_HOST=localhost
DB_PORT=5432
DB_NAME=spatial_platform_dev
DB_USER=spatial_user
DB_PASSWORD=your_password_here
OLLAMA_URL=http://localhost:11434
```

## 開發注意事項

### 編碼規範
- **Go**: 遵循 `gofmt` 格式化規則
- **TypeScript**: 使用嚴格模式
- **CSS**: 優先使用 TailwindCSS 類別
- **Git**: 使用有意義的提交訊息

### 測試策略
- 單元測試: Go 的 `testing` 包
- 前端測試: Vitest (如需要)
- 整合測試: API 端點測試
- E2E 測試: 使用 Playwright (如需要)

---

*Claude Code 工作記憶檔 | 版本: 1.0 | 維護: 開發團隊 | 最後更新: 2025-09-14*