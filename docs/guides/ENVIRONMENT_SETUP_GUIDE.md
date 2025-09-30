# 🌍 環境配置指南

> 智慧空間平台 - 雙環境管理完整說明

## 📋 目錄

1. [環境概述](#環境概述)
2. [開發環境](#開發環境-dev)
3. [生產環境](#生產環境-prod)
4. [環境切換](#環境切換)
5. [常見問題](#常見問題)

---

## 🎯 環境概述

本專案提供**兩種**環境配置：

| 環境 | 用途 | 配置檔案 | 特點 |
|-----|------|---------|------|
| **開發環境** | 本機開發 | `podman-compose.dev.yml` | 熱重載、快速迭代 |
| **生產環境** | 正式部署 | `podman-compose.yml` | 優化構建、Nginx 代理 |

### 統一端口策略

**所有環境統一使用 `7003` 端口**

```
開發環境: http://localhost:7003
生產環境: http://localhost:7003

一個端口，零配置切換！
```

---

## 🔧 開發環境 (Dev)

### 特點
- ✅ **熱重載** - 修改程式碼即時生效
- ✅ **快速迭代** - 不需重新構建
- ✅ **調試友好** - 即時查看變更
- ✅ **數據庫隱藏** - 容器內訪問，更安全

### 啟動方式

```bash
# 使用統一腳本（推薦）
./run dev

# 或手動啟動
podman-compose -f podman-compose.dev.yml up -d

# 查看日誌
./run dev-logs

# 停止環境
./run dev-stop
```

### 訪問地址
- **統一入口**: http://localhost:7003
- **API**: http://localhost:7003/api/v1
- **WebSocket**: ws://localhost:7003/ws

### 適用場景
- 本機開發新功能
- 調試 bug
- 快速驗證代碼

### 內部架構

```
localhost:7003
    ↓
Nginx (容器內 port 80)
    ├─→ / → Vite Dev Server (熱重載)
    ├─→ /api → Go Backend (Air 熱重載)
    └─→ /ws → WebSocket
```

---

## 🚀 生產環境 (Prod)

### 特點
- ✅ **優化構建** - 最佳化的前後端代碼
- ✅ **生產級配置** - Nginx 反向代理
- ✅ **容器化部署** - 無需本機依賴
- ✅ **數據庫隱藏** - 僅容器內訪問
- ⚠️ **需要構建** - 修改代碼需重新構建

### 啟動方式

```bash
# 使用統一腳本（推薦）
./run prod

# 或手動啟動
cd web && npm run build && cd ..
podman-compose --profile prod up -d

# 查看日誌
./run prod-logs

# 停止環境
./run prod-stop
```

### 訪問地址
- **統一入口**: http://localhost:7003（與開發環境相同！）
- **API**: http://localhost:7003/api/v1
- **WebSocket**: ws://localhost:7003/ws

### 適用場景
- 正式部署
- 生產環境驗證
- 提交前測試
- 演示給客戶

### 內部架構

```
localhost:7003
    ↓
Nginx (容器內 port 80)
    ├─→ / → 前端 dist (構建後的靜態文件)
    ├─→ /api → Go Binary (編譯後的二進制文件)
    └─→ /ws → WebSocket
```

---

## 🔄 環境切換

### 從開發切換到生產

```bash
# 1. 停止開發環境
./run dev-stop

# 2. 啟動生產環境
./run prod

# 3. 打開瀏覽器（地址不變！）
open http://localhost:7003
```

### 從生產切換到開發

```bash
# 1. 停止生產環境
./run prod-stop

# 2. 啟動開發環境
./run dev

# 3. 打開瀏覽器（地址不變！）
open http://localhost:7003
```

### 同時運行？❌

**不建議同時運行兩個環境**，因為：
- 端口衝突（都使用 7003）
- 資源消耗
- 容易混淆

---

## 🛠️ 開發工作流程

### 日常開發

```bash
# 1. 早上開機
./run dev

# 2. 開發整天
# - 修改代碼
# - 瀏覽器自動刷新
# - 始終訪問 localhost:7003

# 3. 晚上關機
./run dev-stop
```

### 提交前驗證

```bash
# 1. 開發完成
./run dev-stop

# 2. 驗證生產構建
./run prod
open http://localhost:7003

# 3. 測試通過
./run prod-stop

# 4. 提交代碼
git add .
git commit -m "feat: new feature"
git push
```

---

## 🧰 工具指令

### 構建前端

```bash
./run build
```

### 運行測試

```bash
./run test-run
```

### 進入容器

```bash
# 進入後端容器
./run shell

# 進入數據庫
./run db
```

### 查看狀態

```bash
./run status
```

### 清理所有環境

```bash
./run clean
```

---

## ❓ 常見問題

### Q1: 開發環境和生產環境有什麼區別？

**開發環境**：
- 代碼熱重載（修改後立即生效）
- 使用 Vite Dev Server
- 後端使用 Air 熱重載
- 適合快速開發

**生產環境**：
- 前端構建為靜態文件（優化後）
- 後端編譯為二進制文件（優化後）
- 使用 Nginx 服務靜態資源
- 適合部署和驗證

### Q2: 為什麼統一端口？

**優點**：
1. **簡單** - 只需記住 7003
2. **一致** - 所有環境相同
3. **零配置** - 切換環境無需修改配置
4. **防錯** - 不會訪問錯誤端口
5. **CI/CD 友好** - 測試腳本統一

### Q3: 數據庫端口呢？

**數據庫不對外暴露**：
- 只能在容器網絡內訪問
- 更安全
- 通過 `./run db` 進入數據庫操作

### Q4: 生產環境需要重新構建嗎？

**是的**，每次修改代碼後需要重新構建：

```bash
./run prod-stop
./run prod  # 自動構建並啟動
```

或只構建前端：

```bash
./run build
```

### Q5: 如何在不同電腦上測試？

```bash
# 在任何有 Podman 的電腦上
git clone https://github.com/yes1688/smartmap-platform.git
cd smartmap-platform
cp .env.example .env
# 編輯 .env 填入 API Keys

# 啟動生產環境
./run prod

# 訪問
open http://localhost:7003
```

### Q6: 端口 7003 被佔用怎麼辦？

```bash
# 方法 1: 修改 .env
echo "PORT=7005" > .env

# 方法 2: 臨時覆蓋
PORT=7005 ./run dev

# 方法 3: 找出佔用進程
sudo lsof -i :7003
```

### Q7: 如何查看運行狀態？

```bash
./run status
```

### Q8: 如何清理所有環境？

```bash
./run clean
```

**警告**：這會刪除所有容器、網絡和數據卷！

---

## 🎯 最佳實踐

### DO ✅

1. **日常開發使用 dev**
   ```bash
   ./run dev
   ```

2. **提交前驗證使用 prod**
   ```bash
   ./run prod
   ```

3. **只記一個端口**
   ```
   http://localhost:7003
   ```

4. **使用統一腳本**
   ```bash
   ./run [command]
   ```

### DON'T ❌

1. **不要同時運行兩個環境**
   ```bash
   # ❌ 不要這樣做
   ./run dev
   ./run prod  # 端口衝突！
   ```

2. **不要直接訪問內部端口**
   ```bash
   # ❌ 不要這樣做
   http://localhost:3000  # 前端內部端口
   http://localhost:8080  # 後端內部端口
   ```

3. **不要在代碼中寫死端口**
   ```javascript
   // ❌ 不要這樣做
   fetch('http://localhost:8080/api')

   // ✅ 正確做法
   fetch('/api/v1/endpoint')
   ```

---

## 📚 相關文檔

- **[統一端口架構指南](UNIFIED_PORT_GUIDE.md)** - 統一端口設計理念
- **[Podman 容器指南](PODMAN_GUIDE.md)** - 容器管理詳解
- **[快速測試指南](QUICK_START_TESTING_GUIDE.md)** - 測試流程

---

*環境配置指南 | 最後更新: 2025-09-30*