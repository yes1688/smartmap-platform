# Claude Code 工作記憶檔

## ⚠️ 核心開發規則

**最重要：禁止執行以下指令**
- `npm run dev`
- `cd web && npm run dev`
- 任何直接啟動 Vite 的指令

**正確做法：**
- ✅ 開發環境：`podman-compose -f podman-compose.dev.yml up`
- ✅ 生產環境：`podman-compose up`
- ✅ 統一容器管理：支援前後端熱重載

## 當前專案狀態

**專案名稱**: 智慧空間平台 (Intelligent Spatial Platform)
**技術棧**: Go + SolidJS + Deck.gl + MapLibre GL + PostgreSQL + Ollama
**最後更新**: 2025-09-30

**當前狀態**:
- ✅ CesiumJS 已完全移除，改用 Deck.gl + MapLibre GL
- ✅ 地圖：30度傾斜視角 + ESRI 地形圖底圖
- 🚀 **AI助手革命性重構完成** - 全新智能空間控制台
- ✅ 新智能語音球 + 底部工具列 + 搜索系統 + 上下文面板
- 📱 專業UI/UX設計，Glass Morphism視覺語言
- 🎯 從聊天助手 → 智能操作代理的設計哲學轉變
- 🐳 **統一容器管理完成** - 開發/生產環境分離，支援熱重載

## 核心開發指令

### 開發環境 (支援熱重載)
```bash
# 啟動完整開發環境 (前端 + 後端 + 數據庫)
podman-compose -f podman-compose.dev.yml up

# 背景運行開發環境
podman-compose -f podman-compose.dev.yml up -d

# 查看開發環境日誌
podman-compose -f podman-compose.dev.yml logs -f

# 停止開發環境
podman-compose -f podman-compose.dev.yml down
```

### 生產環境 (多階段構建)
```bash
# 構建前端資源
npm run build -w web

# 啟動生產環境
podman-compose up -d

# 查看生產環境日誌
podman-compose logs -f

# 停止生產環境
podman-compose down
```

### 常用管理指令
```bash
# 查看容器狀態
podman-compose ps

# 重新構建容器 (開發環境)
podman-compose -f podman-compose.dev.yml build

# 重新構建容器 (生產環境)
podman-compose build
```

## 專案結構

```
intelligent-spatial-platform/
├── web/                    # SolidJS 前端 (port 3000)
│   ├── src/components/    # UI 組件
│   ├── src/stores/       # 狀態管理
│   └── src/config.ts     # 配置檔案
├── internal/             # Go 後端邏輯
├── containers/           # 容器配置
└── docs/                # 詳細文檔
```

## 文檔索引

詳細文檔請參考：
- [API 文檔](docs/API.md) - REST API 和 WebSocket 規格
- [開發指南](docs/DEVELOPMENT.md) - 完整開發工作流程
- [問題排除](docs/TROUBLESHOOTING.md) - 常見問題和解決方案
- [部署文檔](docs/DEPLOYMENT.md) - 環境配置和部署

---

*Claude Code 工作記憶檔 | 精簡版 | 最後更新: 2025-09-15*