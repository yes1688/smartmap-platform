# 智能空間平台前端 (SolidJS)

基於 SolidJS 的現代化前端應用程式，結合 CesiumJS 3D 地圖、語音控制和 AI 聊天功能。

## 🚀 技術特點

- **SolidJS** - 高效能的反應式 UI 框架
- **CesiumJS** - 3D 地球儀和地圖視覺化
- **Vite** - 快速的建構工具
- **TypeScript** - 型別安全的開發體驗
- **Tailwind CSS** - 實用優先的 CSS 框架

## 📦 專案結構

```
web-solid/
├── src/
│   ├── components/        # SolidJS 組件
│   │   ├── Header.tsx
│   │   ├── CesiumMap.tsx
│   │   ├── GamePanel.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── VoicePanel.tsx
│   │   └── HistoricalSitePanel.tsx
│   ├── stores/           # 狀態管理
│   │   └── gameStore.ts
│   ├── types.ts         # TypeScript 型別定義
│   ├── config.ts        # 應用程式配置
│   ├── App.tsx         # 主應用程式組件
│   ├── index.tsx       # 應用程式入口
│   └── index.css       # 全域樣式
├── public/              # 靜態資源
├── dist/               # 建構輸出
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🛠️ 開發

### 安裝依賴

```bash
cd web-solid
npm install
```

### 開發模式

```bash
npm run dev
```

應用程式將在 `http://localhost:3000` 啟動

### 建構生產版本

```bash
npm run build
```

建構輸出將在 `dist/` 目錄

### 型別檢查

```bash
npm run type-check
```

## ⚙️ 環境變數

複製 `.env.example` 到 `.env.development` 並設定：

```bash
# Cesium Access Token (必須)
VITE_CESIUM_ACCESS_TOKEN=your_token_here

# API 端點
VITE_API_BASE_URL=http://localhost:8080/api/v1

# WebSocket 端點
VITE_WS_URL=ws://localhost:8080/ws
```

## 🎮 功能介紹

### 1. 3D 地圖 (CesiumMap)
- 基於 CesiumJS 的 3D 地球儀
- 支援點擊移動玩家位置
- 歷史景點標記與資訊顯示
- 遊戲道具視覺化

### 2. 遊戲系統 (GamePanel)
- 即時分數顯示
- 等級進階系統
- 活動記錄追蹤
- 附近道具統計

### 3. AI 聊天 (ChatPanel)
- 智能對話系統
- 快速回應機制
- 對話歷史記錄
- 上下文理解

### 4. 語音控制 (VoicePanel)
- Web Speech API 整合
- 繁體中文語音識別
- 指令範例提示
- 即時狀態顯示

### 5. 歷史景點 (HistoricalSitePanel)
- 景點詳細資訊
- AI 生成介紹
- 語音導覽功能
- 參觀統計

## 🔧 核心技術

### 狀態管理
使用 SolidJS 的 `createStore` 和 `createSignal` 進行響應式狀態管理：

```typescript
// gameStore.ts
const [gameState, setGameState] = createStore<GameState>({
  player: undefined,
  playerStats: { ... },
  nearbyItems: [],
  isGameActive: false,
});
```

### CesiumJS 整合
在 SolidJS 組件中安全地使用 CesiumJS：

```typescript
onMount(async () => {
  Cesium.Ion.defaultAccessToken = CONFIG.cesium.accessToken;
  viewer = new Cesium.Viewer(mapContainer, { ... });
});

onCleanup(() => {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
});
```

### 型別安全
完整的 TypeScript 支援，包括：
- 介面定義 (`types.ts`)
- 配置型別 (`config.ts`)
- 組件 Props 型別檢查

## 📱 響應式設計

使用 Tailwind CSS 實現完全響應式設計：
- 行動裝置優先
- 彈性面板佈局
- 適應性字體大小
- 觸控友善介面

## 🎨 UI/UX 特色

- **玻璃擬態效果** - 現代化半透明面板
- **流暢動畫** - CSS 動畫和過渡效果
- **直覺操作** - 清晰的視覺回饋
- **無障礙設計** - ARIA 標籤和鍵盤導航

## 🚀 性能優化

- **代碼分割** - Vite 自動分割 Cesium 等大型庫
- **懶加載** - 組件按需載入
- **快取策略** - 靜態資源長期快取
- **束包分析** - 最小化輸出大小

## 🧪 測試 (規劃中)

```bash
# 單元測試
npm run test

# E2E 測試
npm run test:e2e

# 測試覆蓋率
npm run test:coverage
```

## 📦 部署

應用程式設計為容器化部署：

1. 前端在 Docker 多階段建構中編譯
2. 靜態檔案由 Nginx 服務
3. 支援 SPA 路由
4. 生產級快取策略

## 🤝 開發指南

### 新增組件

1. 在 `src/components/` 建立新組件
2. 使用 TypeScript 和 Props 介面
3. 遵循 SolidJS 最佳實踐
4. 添加適當的樣式類別

### 狀態管理

1. 複雜狀態使用 `createStore`
2. 簡單狀態使用 `createSignal`
3. 副作用使用 `createEffect`
4. 資源載入使用 `createResource`

### 樣式規範

1. 使用 Tailwind CSS 類別
2. 避免內聯樣式
3. 保持組件樣式一致性
4. 響應式設計優先

這個前端應用程式展現了現代 Web 開發的最佳實踐，結合了效能、可維護性和優秀的使用者體驗。