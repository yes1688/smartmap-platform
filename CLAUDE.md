# Claude AI 助手工作指南

> **本文件專為 Claude AI 助手設計** - 請嚴格遵循以下規則和哲學

## ⚠️ 核心開發規則

**最重要：禁止執行以下指令**
- `npm run dev`
- `cd web && npm run dev`
- 任何直接啟動 Vite 的指令

**正確做法：**
- ✅ 開發環境：`make dev`
- ✅ 生產環境：`make prod`
- ✅ 統一使用 Makefile 管理所有操作

## 💡 Linus Torvalds 開發哲學

**本專案遵循 Linux 創辦人 Linus Torvalds 的實用主義開發哲學**

### 核心原則

#### 1. **"Talk is cheap. Show me the code."**
> 「廢話少說，直接給我看程式碼」

- ✅ 實際能運作的程式碼才是真理
- ✅ 不要空談理論和過度設計
- ✅ 快速實現，逐步改進

#### 2. **"Perfect is the enemy of good"**
> 「完美是良好的敵人」

- ✅ 先讓功能運作，再慢慢改進
- ✅ 避免追求完美而延遲發布
- ✅ 漸進式演進勝過大爆炸式重寫

#### 3. **實用主義至上**
> 「如果某個醜陋的解決方案有效，就用它」

- 🎯 技術決策基於實際需求，不是理論
- 🎯 效能和穩定性優先於「優雅」
- 🎯 不要為了重構而重構

#### 4. **品味 (Taste) 很重要**
> 「好的品味就是知道什麼時候該說不」

- 👍 保持程式碼簡潔、清晰
- 👍 拒絕不必要的複雜性
- 👍 好的架構是逐步演化出來的

#### 5. **反對過度抽象**
> 「抽象是危險的，尤其是錯誤的抽象」

- ❌ 避免過度設計和過早優化
- ❌ 不要為了「模式」而使用設計模式
- ❌ 簡單直接的解決方案往往更好

### 🎯 應用到本專案

#### ✅ DO（該做的）
1. **先實現功能，再優化架構**
   - 功能正常運作 > 完美架構
   - 發現痛點再重構，不要預測

2. **保持簡單**
   - 能用一個函數解決就不要建類別
   - 能用簡單邏輯就不要複雜設計

3. **漸進式改進**
   - 小步快跑，持續改進
   - 每次改進都要能運作

4. **程式碼勝於註解**
   - 寫自解釋的程式碼
   - 必要時才加註解

5. **效能優先**
   - 不接受效能倒退
   - 穩定性高於新功能

#### ❌ DON'T（不該做的）
1. **不要過度設計**
   - ❌ 避免「未來可能需要」的抽象層
   - ❌ 不要一開始就追求完美架構
   - ❌ YAGNI（You Aren't Gonna Need It）

2. **不要過度抽象**
   - ❌ 不要為了「解耦」而建立太多接口
   - ❌ 不要為了「可擴展」而增加複雜度
   - ❌ 除非真的需要，否則不要抽象

3. **不要過早重構**
   - ❌ 功能還沒穩定就大規模重構
   - ❌ 沒有明確痛點就開始「優化架構」
   - ❌ 為了「美觀」而犧牲穩定性

4. **不要理論優先**
   - ❌ 「這個設計模式很適合」→ 先問：真的需要嗎？
   - ❌ 「這樣架構更優雅」→ 先問：解決什麼問題？
   - ❌ 「應該先設計 UML」→ 先寫程式碼看看

### 📊 決策準則

當面臨技術決策時，問自己：

```
1. ⚡ 這個方案能解決實際問題嗎？
2. 🎯 這是最簡單的解決方案嗎？
3. 🚀 這個改動會破壞現有功能嗎？
4. 💪 這個方案能長期維護嗎？
5. 🔧 如果失敗了，容易回退嗎？
```

**優先順序**: 運作 > 簡單 > 效能 > 優雅

### 🎓 經典語錄參考

> "Bad programmers worry about the code. Good programmers worry about data structures and their relationships."
>
> 「差勁的程式設計師擔心程式碼，優秀的程式設計師擔心資料結構及其關係」

> "I'm not a visionary. I'm an engineer."
>
> 「我不是夢想家，我是工程師」

**記住**：先讓它運作，再讓它優雅。功能完成 > 完美設計。🚀

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

## 📚 文檔管理系統

**本專案採用標準化文檔管理系統** - 完整的計畫追蹤、模板化流程、智能索引

### 📋 核心文檔
- **[PROJECT_INDEX.md](docs/PROJECT_INDEX.md)** - 📊 計畫索引中心（查看所有計畫狀態）
- **[docs/README.md](docs/README.md)** - 🌟 文檔系統完整說明
- **[SOP.md](docs/SOP.md)** - 📋 標準作業程序（所有操作流程）
- **[ARCHITECTURE_ANALYSIS.md](ARCHITECTURE_ANALYSIS.md)** - 🏗️ 架構分析報告（最新）

### 🎯 技術文檔
- [API.md](docs/API.md) - REST API 和 WebSocket 規格
- [DEVELOPMENT.md](docs/DEVELOPMENT.md) - 開發工作流程
- [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - 問題排除指南

### 📝 文檔管理規則

#### ⏰ 時間戳命名系統
```bash
# 使用 YYYYMMDD_HHMMSS 格式
20250930_193000_Feature_Name.md  # 2025年9月30日 19:30:00

# 快速生成時間戳
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
```

#### 🔄 計畫生命週期
```
🟢 ACTIVE → ✅ COMPLETED → 📦 ARCHIVED (30天後)
         ↘ ❌ CANCELLED
```

#### 📂 目錄結構
```
docs/
├── PROJECT_INDEX.md          # 【核心】所有計畫索引
├── README.md                 # 文檔系統說明
├── SOP.md                    # 標準作業程序
├── plans/                    # 計畫管理
│   ├── active/              # 🟢 進行中
│   ├── completed/           # ✅ 已完成
│   ├── archived/            # 📦 已歸檔
│   └── cancelled/           # ❌ 已取消
└── templates/               # 文檔模板
    ├── PLAN_TEMPLATE.md     # 計畫模板
    └── ANALYSIS_TEMPLATE.md # 分析模板
```

#### 🚀 建立新計畫（5分鐘流程）
```bash
# 1. 生成時間戳
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 2. 複製模板
cp docs/templates/PLAN_TEMPLATE.md \
   "docs/plans/active/${TIMESTAMP}_Your_Plan_Name.md"

# 3. 編輯計畫內容（填寫必填項目）
vim "docs/plans/active/${TIMESTAMP}_Your_Plan_Name.md"

# 4. 更新索引（重要！）
vim docs/PROJECT_INDEX.md
```

#### ✅ 品質檢查清單
- [ ] 時間戳格式正確 (YYYYMMDD_HHMMSS)
- [ ] 檔案命名使用英文（避免特殊字符）
- [ ] 必填欄位完整（計畫ID、名稱、優先級）
- [ ] 目標明確且可執行
- [ ] PROJECT_INDEX.md 已更新

#### 📊 專案統計（最新）
- **後端程式碼**: 18 個 Go 檔案，3,004 行
- **前端程式碼**: 30 個 TS/TSX 檔案，9,546 行
- **文檔**: 15+ 個 Markdown 文件，1,328+ 行
- **總計**: ~12,550 行程式碼 + 完整文檔系統

### 🎯 Claude AI 必須遵守的規則

#### 文檔管理規則
1. ✅ **建立計畫時必須遵循 SOP-001 流程**
2. ✅ **所有計畫必須更新 PROJECT_INDEX.md**
3. ✅ **使用標準模板（不自創格式）**
4. ✅ **時間戳必須精確到秒**
5. ✅ **完成計畫後移動到 completed/ 目錄**
6. ✅ **重大變更需要建立分析報告（ANALYSIS_TEMPLATE）**

#### 開發哲學規則
1. 🎯 **先實現功能，再考慮重構** - 不要一開始就追求完美架構
2. 🎯 **保持簡單** - 能用簡單方案就不要複雜設計
3. 🎯 **漸進式改進** - 小步快跑，每次改進都能運作
4. 🎯 **不過度抽象** - 除非真的需要，否則不要建立抽象層
5. 🎯 **效能優先** - 不接受效能倒退，穩定性高於新功能

#### 技術決策流程
當用戶要求重構或架構改進時，Claude 必須先問：
```
1. ⚡ 當前方案有什麼實際問題？（不能只是「不夠優雅」）
2. 🎯 這是最簡單的解決方案嗎？
3. 🚀 改動會破壞現有功能嗎？
4. 💪 真的需要現在做嗎？（YAGNI 原則）
5. 🔧 失敗了容易回退嗎？
```

**決策優先順序**: 運作 > 簡單 > 效能 > 優雅

### 📖 參考文檔
- **[docs/README.md](docs/README.md)** - 文檔系統完整介紹
- **[docs/SOP.md](docs/SOP.md)** - 7 個標準作業程序
- **[ARCHITECTURE_ANALYSIS.md](ARCHITECTURE_ANALYSIS.md)** - 架構分析報告

---

## 🤖 Claude AI 工作流程

### 當用戶要求新功能時
1. 📝 先詢問核心需求和痛點
2. 💡 提出最簡單的實現方案
3. 🚀 快速實現並測試
4. 📊 功能完成後再考慮優化

### 當用戶要求重構時
1. ❓ 先問：「當前有什麼實際問題？」
2. 🎯 評估：是否真的需要現在重構？
3. 📋 如果需要，建立重構計畫（使用 PLAN_TEMPLATE）
4. 🔧 小步重構，確保每步都能運作

### 當用戶要求架構設計時
1. 💭 提醒：「先實現功能，架構會逐步演化」
2. 🎯 問：「要解決什麼具體問題？」
3. 📝 基於實際需求給建議，不是理論
4. ✅ 優先簡單方案，避免過度設計

### 當發現問題時
1. 🔍 先確認問題確實存在（不是理論問題）
2. 📊 評估影響範圍和嚴重程度
3. 🚀 提出最小改動方案
4. 📝 重大問題建立分析報告（ANALYSIS_TEMPLATE）

---

## 📋 快速參考

### 容器管理
```bash
# 查看所有指令
make help

# 開發環境
make dev          # 啟動
make dev-logs     # 查看日誌
make dev-down     # 停止

# 生產環境
make prod         # 啟動
make prod-logs    # 查看日誌
make prod-down    # 停止

# 其他
make status       # 查看狀態
make clean        # 清理所有
```

### 建立計畫
```bash
# 生成時間戳並建立計畫
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
cp docs/templates/PLAN_TEMPLATE.md "docs/plans/active/${TIMESTAMP}_Plan_Name.md"
# 記得更新 PROJECT_INDEX.md！
```

### 決策口訣
> **「能運作 > 簡單 > 快 > 美」**
>
> 先讓它運作，再讓它優雅。功能完成 > 完美設計。

---

*Claude AI 助手工作指南 | 最後更新: 2025-09-30*