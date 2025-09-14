# 智能空間平台 (Intelligent Spatial Platform)

> 一個結合 AI、語音控制和 3D 地圖的智能空間平台，用於應徵作品展示

[![Go Version](https://img.shields.io/badge/Go-1.21+-blue.svg)](https://golang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()

## 🌟 專案特色

- **🗺️ 3D 地圖視覺化**: 基於 CesiumJS 的高品質 3D 地球儀
- **🤖 AI 智能對話**: 整合 Ollama 本地 LLM 進行智能互動
- **🎤 語音控制**: 支援繁體中文語音識別與合成
- **🎮 互動遊戲**: 物品收集、分數系統與等級進階
- **🏛️ 歷史景點**: 自動介紹台灣歷史文化景點
- **⚡ 即時通訊**: WebSocket 支援多人互動
- **🐳 容器化部署**: 使用 Podman 進行容器編排
- **📍 空間資料庫**: PostGIS 支援地理資訊查詢

## 🏗️ 技術架構

### 後端技術棧
- **Go 1.21+** - 主要程式語言
- **Gin** - Web 框架
- **PostgreSQL + PostGIS** - 空間資料庫
- **Ollama** - 本地 LLM 服務
- **WebSocket** - 即時通訊
- **GORM** - ORM 資料庫操作

### 前端技術棧
- **CesiumJS** - 3D 地圖渲染引擎
- **WebRTC** - 語音識別 API
- **WebSocket** - 即時通訊
- **Vanilla JavaScript** - 原生前端開發

### 基礎設施
- **Podman + Podman Compose** - 容器化部署
- **Nginx** - 反向代理與靜態檔案服務
- **多階段構建** - 優化容器映像大小

## 🚀 快速開始

### 系統需求

- **操作系統**: Linux/macOS/Windows
- **容器運行時**: Podman 4.0+
- **開發工具**: Go 1.21+, Git

### 一鍵部署 (推薦)

```bash
# 克隆專案
git clone https://github.com/your-username/intelligent-spatial-platform.git
cd intelligent-spatial-platform

# 執行開發環境設定腳本
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh
```

### 手動安裝

1. **環境準備**
```bash
# 複製環境設定檔
cp .env.dev .env

# 編輯環境變數 (重要！)
vim .env
# 設定以下項目:
# - CESIUM_ACCESS_TOKEN: 到 https://ion.cesium.com/ 取得
# - DB_PASSWORD: 設定安全的資料庫密碼
# - JWT_SECRET: 設定 JWT 金鑰
```

2. **初始化 Go 模組**
```bash
go mod tidy
```

3. **啟動服務**
```bash
# 啟動資料庫和 AI 服務
podman-compose up -d postgres ollama

# 等待服務就緒 (約 30 秒)
sleep 30

# 啟動主應用程式和 Nginx
podman-compose up -d app nginx
```

4. **訪問應用程式**
```bash
# 開啟瀏覽器訪問
open http://localhost:3000
```

## 📁 專案結構

```
intelligent-spatial-platform/
├── cmd/server/                 # 應用程式入口
│   └── main.go
├── internal/                   # 核心業務邏輯
│   ├── api/                   # REST API 處理器
│   ├── ai/                    # Ollama AI 整合
│   ├── game/                  # 遊戲邏輯
│   ├── geo/                   # 地理資料處理
│   ├── voice/                 # 語音處理
│   └── websocket/             # WebSocket 處理
├── web/                       # CesiumJS 前端
│   ├── index.html
│   ├── css/main.css
│   └── js/
│       ├── main.js           # 主應用程式
│       ├── cesium-map.js     # 3D 地圖管理
│       ├── game.js           # 遊戲邏輯
│       ├── voice.js          # 語音控制
│       ├── ai-chat.js        # AI 對話
│       └── websocket.js      # 即時通訊
├── containers/                # 容器配置
│   ├── Containerfile         # 多階段構建檔
│   ├── nginx.conf           # Nginx 設定
│   └── start.sh             # 智能啟動腳本
├── scripts/                  # 部署腳本
│   ├── dev-setup.sh         # 開發環境設定
│   └── production-deploy.sh # 生產環境部署
├── configs/                  # 應用設定
├── .env.dev                  # 開發環境變數
├── .env.prod                # 生產環境變數
├── podman-compose.yml       # 容器編排檔
├── go.mod                   # Go 模組定義
└── README.md               # 專案說明
```

## 🎮 功能說明

### 1. 3D 地圖導航
- 基於 CesiumJS 的高品質 3D 地球儀
- 支援地形、衛星影像、街道地圖
- 平滑的相機控制與場景切換
- 自定義標記與資訊視窗

### 2. AI 智能助手
- 整合 Ollama 本地 LLM (支援 Llama2)
- 中文對話與語境理解
- 歷史景點自動介紹生成
- 遊戲狀態分析與建議

### 3. 語音控制系統
- Web Speech API 語音識別
- 支援繁體中文指令
- 語音合成回應
- 常用指令模式識別

#### 支援的語音指令:
```
"導航到最近的歷史景點"
"收集附近的物品"
"介紹這個地方"
"顯示我的遊戲統計"
"我的分數是多少"
```

### 4. 互動遊戲機制
- 物品收集與分數系統
- 三種稀有度: 普通(綠色)、稀有(藍色)、傳說(金色)
- 等級進階系統
- 歷史景點發現獎勵
- 即時排行榜 (多人模式預備)

### 5. 歷史文化教育
- 台灣歷史景點資料庫
- AI 自動生成景點介紹
- 地理位置觸發機制
- 文化知識問答 (規劃中)

## 🔧 API 文檔

### REST API 端點

```http
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

### WebSocket 事件

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

## 🚀 部署指南

### 開發環境

```bash
# 使用開發設定腳本
./scripts/dev-setup.sh

# 或手動啟動
podman-compose up -d
```

### 生產環境

```bash
# 設定生產環境變數
cp .env.prod .env
vim .env  # 編輯關鍵設定

# 執行生產部署
./scripts/production-deploy.sh
```

### 環境變數配置

**重要設定項目:**

```bash
# Cesium 3D 地圖 (必須)
CESIUM_ACCESS_TOKEN=your_cesium_token_here

# 資料庫設定
DB_PASSWORD=secure_password_here

# 安全性設定
JWT_SECRET=your_jwt_secret_here

# AI 模型設定
OLLAMA_MODEL=llama2:7b  # 或 llama2:13b (生產環境)
```

## 🔍 監控與維護

### 健康檢查

```bash
# 應用程式健康狀態
curl http://localhost:3000/health

# 服務狀態檢查
podman-compose ps

# 查看服務日誌
podman-compose logs -f app
```

### 性能監控

```bash
# 容器資源使用
podman stats

# 資料庫連線狀態
podman exec spatial-postgres pg_stat_activity

# Ollama 模型狀態
curl http://localhost:11434/api/tags
```

## 🤝 開發指南

### 本地開發

```bash
# 啟動依賴服務
podman-compose up -d postgres ollama

# 本地運行應用程式
go run cmd/server/main.go

# 訪問開發伺服器
open http://localhost:8080
```

### 程式碼結構

- **cmd/server/**: 應用程式入口點
- **internal/api/**: REST API 路由與處理器
- **internal/ai/**: Ollama AI 服務整合
- **internal/game/**: 遊戲邏輯與狀態管理
- **internal/geo/**: 地理資訊與空間查詢
- **internal/voice/**: 語音識別與處理
- **internal/websocket/**: WebSocket 通訊

### 新增功能

1. **新增 API 端點**: 在 `internal/api/` 加入處理器
2. **擴展遊戲功能**: 修改 `internal/game/` 邏輯
3. **新增 AI 功能**: 在 `internal/ai/` 整合新能力
4. **前端介面**: 在 `web/js/` 加入新模組

## 📈 技術特點

### 🏗️ 架構設計
- **微服務架構**: 服務解耦，易於擴展
- **事件驅動**: WebSocket 即時通訊
- **RESTful API**: 標準化介面設計
- **分層架構**: 清晰的程式碼組織

### ⚡ 性能優化
- **多階段構建**: 最小化容器大小
- **編譯時優化**: Go 二進制檔部署
- **靜態資源緩存**: Nginx 快取策略
- **資料庫索引**: PostGIS 空間索引

### 🔒 安全性
- **JWT 認證**: 無狀態驗證機制
- **輸入驗證**: API 參數安全檢查
- **HTTPS 支援**: 生產環境加密傳輸
- **容器安全**: 非 root 使用者執行

## 🎯 未來規劃

### 短期目標 (1-2 個月)
- [ ] 用戶註冊與登入系統
- [ ] 更多歷史景點資料
- [ ] 語音指令優化
- [ ] 行動裝置 APP

### 中期目標 (3-6 個月)
- [ ] 多人即時對戰
- [ ] 社群功能與好友系統
- [ ] 進階 AI 對話能力
- [ ] VR/AR 整合

### 長期目標 (6-12 個月)
- [ ] 機器學習推薦系統
- [ ] 國際化多語言支援
- [ ] 雲端部署與 CDN
- [ ] 商業化模式探索

## 🐛 問題排除

### 常見問題

**Q: CesiumJS 地圖無法載入?**
A: 請檢查 CESIUM_ACCESS_TOKEN 是否正確設定

**Q: AI 服務無回應?**
A: 確認 Ollama 服務正常運行，並已下載所需模型

**Q: 語音識別不工作?**
A: 需要 HTTPS 或 localhost 環境，並允許麥克風權限

**Q: 資料庫連線失敗?**
A: 檢查資料庫密碼與連線參數是否正確

### 除錯指令

```bash
# 檢查服務狀態
podman-compose ps

# 查看詳細日誌
podman-compose logs -f [service_name]

# 進入容器除錯
podman exec -it spatial-app sh
podman exec -it spatial-postgres psql -U spatial_user -d spatial_platform_dev

# 重新建構映像
podman-compose build --no-cache
```

## 🤝 貢獻指南

我們歡迎各種形式的貢獻！

### 如何貢獻

1. **Fork 專案**: 點擊 GitHub 上的 Fork 按鈕
2. **建立分支**: `git checkout -b feature/your-feature`
3. **提交修改**: `git commit -am 'Add some feature'`
4. **推送分支**: `git push origin feature/your-feature`
5. **建立 PR**: 建立 Pull Request

### 程式碼規範

- **Go**: 遵循 `gofmt` 格式化規則
- **JavaScript**: 使用 ESLint 檢查
- **Git**: 使用有意義的提交訊息
- **測試**: 重要功能需要單元測試

## 📄 授權條款

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

## 👥 作者資訊

- **開發者**: [您的名字]
- **Email**: [your.email@example.com]
- **GitHub**: [https://github.com/your-username]
- **LinkedIn**: [您的 LinkedIn]

## 🙏 致謝

- **CesiumJS** - 提供出色的 3D 地圖引擎
- **Ollama** - 本地 LLM 解決方案
- **PostgreSQL & PostGIS** - 強大的空間資料庫
- **Go 社群** - 優秀的程式語言生態系統

---

**⭐ 如果這個專案對您有幫助，請給我們一個星星！**

**📧 有任何問題或建議，歡迎開 Issue 或聯繫我們**