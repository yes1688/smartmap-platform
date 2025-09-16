# 智慧空間平台 (Intelligent Spatial Platform)

> 一個結合 AI、語音控制和 3D 地圖的智慧空間平台

[![Go Version](https://img.shields.io/badge/Go-1.21+-blue.svg)](https://golang.org/)
[![SolidJS](https://img.shields.io/badge/SolidJS-1.8+-green.svg)](https://solidjs.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🌟 專案特色

- **🗺️ 3D 地圖視覺化**: 基於 Deck.gl + MapLibre GL 的高品質地形地圖
- **🤖 AI 智慧對話**: 整合 Ollama 本地 LLM 進行智慧互動
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
- **SolidJS 1.8+** - 響應式前端框架
- **Deck.gl + MapLibre GL** - 3D 地圖渲染引擎
- **TailwindCSS** - 樣式框架
- **Vite** - 構建工具
- **WebRTC** - 語音識別 API

### 基礎設施
- **Podman + Podman Compose** - 容器化部署
- **多階段構建** - 優化容器映像大小

## 🚀 快速開始

### 系統需求

- **操作系統**: Linux/macOS/Windows
- **容器運行時**: Podman 4.0+
- **開發工具**: Go 1.21+, Node.js 18+, Git

### 開發環境啟動

```bash
# 克隆專案
git clone https://github.com/your-username/intelligent-spatial-platform.git
cd intelligent-spatial-platform

# 啟動前端開發容器 (推薦)
podman-compose up -d frontend

# 啟動所有服務
podman-compose up -d

# 訪問應用程式
open http://localhost:3000
```

### ⚠️ 重要開發規則

- **禁止執行 `npm run dev`** - 必須使用容器管理
- **前端固定使用 port 3000** - 禁止自動切換端口
- **優先使用容器開發** - `podman-compose up -d frontend`

## 📁 專案結構

```
intelligent-spatial-platform/
├── cmd/server/                 # Go 應用程式入口
├── internal/                   # 核心業務邏輯
│   ├── api/                   # REST API 處理器
│   ├── ai/                    # Ollama AI 整合
│   ├── game/                  # 遊戲邏輯
│   ├── geo/                   # 地理資料處理
│   ├── voice/                 # 語音處理
│   └── websocket/             # WebSocket 處理
├── web/                       # SolidJS 前端 (port 3000)
│   ├── src/components/        # UI 組件
│   ├── src/stores/           # 狀態管理
│   └── src/config.ts         # 配置檔案
├── containers/               # 容器配置
├── docs/                    # 詳細文檔
│   ├── API.md              # API 端點規格
│   ├── DEVELOPMENT.md      # 開發指南
│   ├── TROUBLESHOOTING.md  # 問題排除
│   └── DEPLOYMENT.md       # 部署文檔
└── README.md               # 專案說明
```

## 🎮 功能說明

### 1. 3D 地圖導航
- 基於 Deck.gl + MapLibre GL 的高品質地形地圖
- 30 度傾斜視角提供立體感
- ESRI World Topo Map 地形底圖
- 自定義標記與資訊視窗

### 2. AI 智能助手
- 整合 Ollama 本地 LLM
- 中文對話與語境理解
- 歷史景點自動介紹生成
- 遊戲狀態分析與建議

### 3. 語音控制系統
- Web Speech API 語音識別
- 支援繁體中文指令
- 語音合成回應
- AI 控制兔子移動

#### 支援的語音指令:
```
"移動兔子到台北101"
"介紹這個地方"
"顯示我的遊戲統計"
"收集附近的物品"
```

### 4. 互動遊戲機制
- 兔子角色在地圖上顯示
- 物品收集與分數系統
- 等級進階系統
- AI 控制移動功能

## 📖 詳細文檔

- **[API 文檔](docs/API.md)** - REST API 和 WebSocket 規格
- **[開發指南](docs/DEVELOPMENT.md)** - 完整開發工作流程
- **[問題排除](docs/TROUBLESHOOTING.md)** - 常見問題和解決方案
- **[部署文檔](docs/DEPLOYMENT.md)** - 環境配置和部署

## 🤝 開發指南

### 核心開發指令

```bash
# 啟動前端開發容器
podman-compose up -d frontend

# 查看前端日誌
podman-compose logs -f frontend

# 重啟前端容器
podman-compose restart frontend

# 查看所有容器狀態
podman-compose ps
```

### 程式碼規範

- **Go**: 遵循 `gofmt` 格式化規則
- **TypeScript**: 使用嚴格模式
- **CSS**: 優先使用 TailwindCSS 類別
- **Git**: 使用有意義的提交訊息

## 🎯 當前狀態

- ✅ **地圖系統**: Deck.gl + MapLibre GL 已完成
- ✅ **視角調整**: 30度傾斜視角
- ✅ **地形底圖**: ESRI World Topo Map
- ⚠️ **兔子角色**: 顯示功能需要修復

## 📄 授權條款

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

---

**⭐ 如果這個專案對您有幫助，請給我們一個星星！**

**📧 有任何問題或建議，歡迎開 Issue 或聯繫我們**