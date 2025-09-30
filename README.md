# 智慧空間平台 (Intelligent Spatial Platform)

> 一個結合 AI、語音控制和 3D 地圖的智慧空間平台

[![Go Version](https://img.shields.io/badge/Go-1.23+-blue.svg)](https://golang.org/)
[![SolidJS](https://img.shields.io/badge/SolidJS-1.8+-green.svg)](https://solidjs.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🌟 專案特色

- **🗺️ 3D 地圖視覺化**: 基於 Deck.gl + MapLibre GL 的高品質地形地圖
- **🤖 AI 智慧對話**: 整合 Ollama/OpenRouter 雙 AI 系統
- **🎤 語音控制**: 支援繁體中文語音識別與合成
- **🎮 互動遊戲**: 物品收集、分數系統與等級進階
- **🏛️ 歷史景點**: 自動介紹台灣歷史文化景點
- **⚡ 即時通訊**: WebSocket 支援多人互動
- **🐳 容器化部署**: 使用 Podman 進行容器編排
- **🧪 完整測試**: 23% 測試覆蓋率，持續改進中

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

# 🔧 本機開發（熱重載）
./run dev

# 🚀 生產環境（優化構建）
./run prod
```

### 訪問地址

**所有環境統一使用**: http://localhost:7003

| 環境 | 說明 | 特點 |
|-----|------|-----|
| 開發環境 | `./run dev` | 熱重載 ⚡ |
| 生產環境 | `./run prod` | 優化構建 🚀 |

**統一路由結構**：
- 前端應用：`http://localhost:7003/`
- API 端點：`http://localhost:7003/api/v1`
- WebSocket：`ws://localhost:7003/ws`
- 健康檢查：`http://localhost:7003/health`

✅ **無論哪個環境，永遠都是 7003！**

## 📋 管理指令

### 開發環境（最常用）
```bash
./run dev           # 啟動開發環境（熱重載）
./run dev-stop      # 停止
./run dev-logs      # 查看日誌
```

### 生產環境
```bash
./run prod          # 啟動生產環境
./run prod-stop     # 停止
./run prod-logs     # 查看日誌
```

### 工具指令
```bash
./run build         # 構建前端
./run test-run      # 運行測試
./run shell         # 進入後端容器
./run db            # 進入數據庫
./run status        # 查看狀態
./run clean         # 清理所有環境
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

## 📖 核心功能

### 1. 智慧地圖系統
- 30 度傾斜視角立體地圖
- ESRI World Topo Map 地形底圖
- 自定義標記與資訊視窗
- 即時位置追蹤

### 2. AI 智能助手
- 雙 AI 系統（Ollama + OpenRouter）
- 中文對話與語境理解
- 歷史景點自動介紹
- AI 控制角色移動

### 3. 語音控制
- Web Speech API 語音識別
- 支援繁體中文指令
- 語音合成回應

支援指令範例：
```
"移動兔子到台北101"
"介紹這個地方"
"顯示我的遊戲統計"
```

### 4. 遊戲系統
- 角色在地圖上顯示
- 物品收集與分數系統
- 等級進階
- AI 智能移動

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
./run test-run

# 或手動運行
podman exec spatial-backend-dev go test ./internal/... -v -cover
```

**當前測試覆蓋率**: 23% (持續改進中)

## 🤝 開發工作流程

```bash
# 1. 本機開發
./run dev

# 2. 修改代碼（自動重載）

# 3. 運行測試
./run test-run

# 4. 提交前驗證（生產級構建）
./run dev-stop
./run prod

# 5. 驗證通過後提交
git add .
git commit -m "feat: your feature"
git push
```

## 📊 專案統計

- **後端代碼**: 3,000+ 行 Go
- **前端代碼**: 9,500+ 行 TypeScript/TSX
- **測試代碼**: 370+ 行
- **文檔**: 5,000+ 行
- **測試覆蓋率**: 23%

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
./run dev
```

*智慧空間平台 | 由 Go + SolidJS + AI 驅動 | 2025*