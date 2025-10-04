# 智慧空間平台 (Intelligent Spatial Platform)

> 一個結合 AI、語音控制和 3D 地圖的智慧空間平台

[![Go Version](https://img.shields.io/badge/Go-1.23+-blue.svg)](https://golang.org/)
[![SolidJS](https://img.shields.io/badge/SolidJS-1.8+-green.svg)](https://solidjs.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🌟 核心功能

### ✅ 已實現功能

#### 🗺️ 地圖系統
- **3D 地形視覺化**: Deck.gl + MapLibre GL，30度傾斜視角
- **ESRI 地形底圖**: 高品質地形圖層
- **即時位置追蹤**: 玩家位置實時更新
- **地點標記**: 自定義標記與資訊視窗

#### 🤖 AI 智能系統
- **雙 AI 引擎**: Ollama（本地）+ OpenRouter（雲端）可切換
- **語音識別**: Chrome Web Speech API + SpeechEar 雙系統
- **智能對話**: 中文對話與語境理解
- **移動指令**: AI 解析語音移動指令（如「移動兔子到台北101」）
- **意圖識別**: 支援搜尋、移動、描述、推薦等意圖
- **速率限制**: 防止 API 濫用（可配置每日限制）

#### 🎮 遊戲系統
- **玩家管理**: 角色創建、位置追蹤
- **分數系統**: 物品收集、經驗值、等級進階
- **遊戲會話**: 多人遊戲支援
- **統計追蹤**: 遊戲數據統計與排行

#### 🌐 地理服務
- **Google Places API**: 台灣地點精準搜尋
- **地理編碼**: 地址 ↔ 座標轉換
- **附近地點**: 尋找周邊景點與設施
- **歷史景點**: 台灣文化景點自動介紹

#### ⚡ 系統架構
- **WebSocket**: 即時雙向通訊
- **RESTful API**: 完整的 REST API
- **容器化部署**: Podman Compose 統一管理
- **熱重載開發**: 前後端代碼自動重載
- **健康檢查**: 服務健康狀態監控

#### 🎨 前端特色
- **智能語音球**: 視覺化語音控制介面
- **智能搜尋**: 快速地點搜尋系統
- **上下文面板**: 動態資訊展示
- **手勢引擎**: 觸控手勢支援
- **性能監控**: 即時性能追蹤
- **Glass Morphism**: 現代化玻璃擬態設計

### 🚧 計劃中功能

- **多人即時互動**: WebSocket 基礎已建立，待實現多人同步
- **物品生成系統**: 遊戲物品自動生成機制
- **社交系統**: 玩家互動、好友系統
- **成就系統**: 遊戲成就與獎勵
- **資料視覺化**: 遊戲統計圖表
- **離線支援**: PWA 離線功能

### 📊 技術指標
- **測試覆蓋率**: 23% (持續改進中)
- **API 端點**: 20+ REST API
- **前端組件**: 30+ SolidJS 組件
- **後端服務**: 5 個核心服務模組

## 🚀 快速開始

### 前置需求

- **Podman** 4.0+
- **Go** 1.23+ (本機開發)
- **Node.js** 20+ (本機開發)

### 一鍵啟動

```bash
# 1. Clone 專案
git clone https://github.com/yes1688/smartmap-platform.git
cd smartmap-platform

# 2. 配置環境變數
cp .env.example .env
# 編輯 .env 填入你的 API Keys

# 3. 啟動（二選一）

# 🔧 開發環境（熱重載）
make dev

# 🚀 生產環境（優化構建）
make prod
```

### 訪問地址

**所有環境統一使用**: http://localhost:7003

| 環境 | 說明 | 特點 |
|-----|------|-----|
| 開發環境 | `make dev` | 熱重載 ⚡ |
| 生產環境 | `make prod` | 優化構建 🚀 |

**統一路由結構**：
- 前端應用：`http://localhost:7003/`
- API 端點：`http://localhost:7003/api/v1`
- WebSocket：`ws://localhost:7003/ws`
- 健康檢查：`http://localhost:7003/health`

✅ **無論哪個環境，永遠都是 7003！**

## 📋 管理指令

### 查看所有指令
```bash
make help           # 顯示所有可用指令
```

### 開發環境（最常用）
```bash
make dev            # 啟動開發環境（熱重載）
make dev-down       # 停止
make dev-logs       # 查看日誌
make dev-restart    # 重啟
make dev-build      # 重新構建容器
```

### 生產環境
```bash
make prod           # 啟動生產環境
make prod-down      # 停止
make prod-logs      # 查看日誌
make prod-restart   # 重啟
make prod-build     # 重新構建容器
```

### 其他指令
```bash
make build-frontend # 構建前端靜態檔案
make status         # 查看容器狀態
make clean          # 清理所有容器和資料卷
```

## 🏗️ 技術架構

### 後端
- **Go 1.23** + **Gin** - Web 框架
- **PostgreSQL** + **PostGIS** - 空間資料庫
- **Ollama** / **OpenRouter** - AI 服務（可切換）
- **WebSocket** - 即時通訊
- **GORM** - ORM

### 前端
- **SolidJS 1.8** - 響應式框架
- **Deck.gl** + **MapLibre GL** - 地圖引擎
- **TailwindCSS** - 樣式
- **Vite** - 構建工具

### DevOps
- **Podman** + **Podman Compose** - 容器化
- **GitHub Actions** - CI/CD
- **Nginx** - 反向代理（生產環境）

## 💡 使用範例

### 語音控制指令

智能系統支援自然語言指令，以下是一些範例：

**移動指令**
```
"移動到台北101"
"去高雄"
"帶我去嘉義市吃火雞肉飯"
```

**搜尋指令**
```
"附近有什麼好玩的"
"搜尋台南美食"
"找找看博物館"
```

**查詢指令**
```
"介紹這個地方"
"這裡有什麼歷史"
"我的遊戲統計"
```

### API 使用範例

```bash
# 健康檢查
curl http://localhost:7003/health

# AI 對話
curl -X POST http://localhost:7003/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"介紹台北101","playerId":"user123"}'

# 搜尋地點
curl -X POST http://localhost:7003/api/v1/locations/search \
  -H "Content-Type: application/json" \
  -d '{"query":"台北101"}'

# 獲取玩家狀態
curl "http://localhost:7003/api/v1/game/status?playerId=user123"
```

## 📚 文檔

### 核心文檔
- **[開發指南](docs/DEVELOPMENT.md)** - 完整開發工作流程
- **[API 文檔](docs/API.md)** - REST API 和 WebSocket 規格
- **[問題排除](docs/TROUBLESHOOTING.md)** - 常見問題和解決方案

### 操作指南
- **[快速測試指南](docs/guides/QUICK_START_TESTING_GUIDE.md)** - 新手測試教學
- **[Podman 容器指南](docs/guides/PODMAN_GUIDE.md)** - 容器管理完整說明
- **[環境配置指南](docs/guides/ENVIRONMENT_SETUP_GUIDE.md)** - 多環境管理

### 分析報告
- **[第一階段完成報告](docs/reports/PHASE_1_COMPLETION_REPORT.md)** - 最新改善成果
- **[架構分析](docs/reports/ARCHITECTURE_ANALYSIS.md)** - 專案結構分析
- **[測試框架報告](docs/reports/TEST_SETUP_REPORT.md)** - 測試系統說明

## 🧪 測試

```bash
# 運行所有測試
podman exec spatial-backend-dev go test ./internal/... -v -cover
```

**當前測試覆蓋率**: 23% (持續改進中)

## 🤝 開發工作流程

```bash
# 1. 啟動開發環境
make dev

# 2. 修改代碼（自動重載）

# 3. 運行測試
podman exec spatial-backend-dev go test ./internal/... -v

# 4. 提交前驗證（生產級構建）
make dev-down
make prod

# 5. 驗證通過後提交
git add .
git commit -m "feat: your feature"
git push
```

## 📊 專案統計

### 程式碼規模
- **後端代碼**: 3,000+ 行 Go
  - 5 個核心服務模組（AI, Game, Geo, Voice, WebSocket）
  - 20+ REST API 端點
  - 5 個 Handler 模組
- **前端代碼**: 9,500+ 行 TypeScript/TSX
  - 30+ SolidJS 響應式組件
  - 6 個智能引擎（動畫、手勢、預測、個人化、性能監控）
  - Glass Morphism 視覺設計系統
- **測試代碼**: 370+ 行
- **文檔**: 5,000+ 行 Markdown

### 技術指標
- **測試覆蓋率**: 23% (持續改進中)
- **容器服務**: 4 個（Backend, Frontend, PostgreSQL, Nginx）
- **資料庫**: PostgreSQL + PostGIS（空間資料）
- **API**: RESTful + WebSocket
- **部署**: 完全容器化，一鍵啟動

### API 端點分類
- **遊戲 API**: 玩家管理、物品收集、會話管理、統計
- **AI API**: 對話、移動指令、意圖識別
- **地理 API**: 地點搜尋、地理編碼、附近地點、歷史景點
- **語音 API**: 語音識別處理
- **WebSocket**: 即時雙向通訊

## 🎯 開發哲學

本專案遵循 **Linus Torvalds 實用主義哲學**：

> "Talk is cheap. Show me the code."
>
> "先讓它運作，再讓它完美"

**核心原則**：
- ✅ 功能優先於架構
- ✅ 簡單優於複雜
- ✅ 實用優於優雅
- ✅ 漸進式改進

詳見：[CLAUDE.md](CLAUDE.md)

## 📝 版本歷史

### v1.0.0 (2025-09-30)
- ✅ 完成基礎功能開發
- ✅ 建立測試框架（23% 覆蓋率）
- ✅ API handlers 模組化
- ✅ 前端組件分類
- ✅ CI/CD 自動化
- ✅ 多環境支援

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE)

## 👥 貢獻

歡迎提交 Issue 和 Pull Request！

---

**🎉 現在就開始你的智慧空間之旅！**

```bash
make dev
```

*智慧空間平台 | 由 Go + SolidJS + AI 驅動 | 2025*