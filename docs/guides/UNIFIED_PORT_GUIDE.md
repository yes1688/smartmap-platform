# 🎯 統一端口架構指南

> 所有環境使用統一端口 7004

## 🌟 核心理念

```
一個端口，三種環境
One Port, Three Modes
```

**7004 = 開發環境 = 測試環境 = 生產環境**

---

## 💡 為什麼統一端口？

### ✅ 優點

1. **簡單易記** - 只需記住一個端口
2. **零配置切換** - 環境切換無需修改配置
3. **防止錯誤** - 不會訪問錯端口
4. **CI/CD 友好** - 測試腳本統一
5. **團隊協作** - 大家用同樣的端口

### 📊 對比

#### 之前（多端口）❌
```bash
開發環境: localhost:3002
測試環境: localhost:7004
生產環境: localhost:8081

# 問題：
- 需要記三個端口 😢
- 環境變數配置複雜 😢
- 容易訪問錯端口 😢
- CI/CD 需要多套配置 😢
```

#### 現在（統一端口）✅
```bash
開發環境: localhost:7004
測試環境: localhost:7004
生產環境: localhost:7004

# 優勢：
- 只需記一個端口 ✅
- 零配置切換 ✅
- 不會搞錯 ✅
- CI/CD 配置統一 ✅
```

---

## 🚀 使用方式

### 日常開發

```bash
# 早上開機
./run dev

# 打開瀏覽器
http://localhost:7004

# 一整天都是這個地址
# 修改代碼 → 熱重載 → 刷新瀏覽器
# 始終是 localhost:7004 ✅
```

### 切換環境

```bash
# 開發環境（熱重載）
./run dev
http://localhost:7004  ✅

# 生產環境（優化構建）
./run dev-stop
./run prod
http://localhost:7004  ✅ 同一個地址！
```

### 瀏覽器書籤

```
只需要一個書籤：
📌 智慧空間平台
   http://localhost:7004

無論哪個環境，打開這個書籤就對了！
```

---

## 🏗️ 架構設計

### 統一架構圖

```
所有環境:
┌─────────────────────────────┐
│  訪問: localhost:7004        │
└─────────────────────────────┘
              │
              ▼
    ┌─────────────────┐
    │  Nginx (Port 80)│
    │  內部端口映射    │
    │  7004 → 80      │
    └─────────────────┘
         ├─────┬─────┐
         │     │     │
    前端  │  API │  WS │
    (/) (/api) (/ws)
```

### 環境差異

```
開發環境 (7004):
├─ Nginx → 前端 Vite (熱重載)
├─ Nginx → 後端 Go (熱重載)
├─ 數據庫: 容器內訪問
└─ 特點: 快速開發

生產環境 (7004):
├─ Nginx → 前端 dist (構建後)
├─ Nginx → 後端 binary (優化後)
├─ 數據庫: 容器內訪問（隱藏）
└─ 特點: 優化構建

同一個端口，不同的內部實現！
```

---

## 🎮 實際場景

### 場景 1: 日常開發

```bash
# 開發新功能
./run dev
# 打開 http://localhost:7004

# 修改代碼...
vim internal/ai/service.go

# 刷新瀏覽器 (還是 7004)
# 看到效果 ✅

# 一整天都是 7004
# 完全不用記其他端口
```

### 場景 2: 提交前驗證

```bash
# 開發完成
./run dev-stop

# 生產環境驗證
./run prod

# 打開瀏覽器 (還是 7004)
http://localhost:7004

# 地址沒變！✅
# 只是內部變成了優化構建
```

### 場景 3: 演示給客戶

```bash
# 在客戶電腦上
git clone ...
./run prod

# 告訴客戶訪問：
"請打開 http://localhost:7004"

# 簡單明瞭！✅
```

### 場景 4: CI/CD

```yaml
# GitHub Actions
test:
  - run: ./run prod
  - run: curl http://localhost:7004/health
  # 所有測試都用 7004 ✅
```

---

## 🔧 配置說明

### 環境變數

```bash
# .env 檔案
PORT=7004  # 就這一個！

# 所有環境都讀這個變數
```

### podman-compose 配置

```yaml
# 開發環境
nginx:
  ports:
    - "${PORT:-7004}:80"  ✅

# 測試環境
nginx:
  ports:
    - "${PORT:-7004}:80"  ✅

# 生產環境
nginx:
  ports:
    - "${PORT:-7004}:80"  ✅

# 全部統一！
```

---

## 📱 前端配置

### Vite 配置自動適配

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://backend:8080',  // 內部路由
      '/ws': {
        target: 'ws://backend:8080',
        ws: true
      }
    }
  }
})

// 前端代碼中直接使用相對路徑
fetch('/api/v1/health')  ✅
// 無論哪個環境都能正常工作
```

---

## ⚡ 端口衝突處理

### 如果 7004 被佔用？

```bash
# 方法 1: 修改 .env
echo "PORT=7005" > .env

# 方法 2: 環境變數覆蓋
PORT=7005 ./run dev

# 方法 3: 找出佔用進程
sudo lsof -i :7004
# 殺掉佔用的進程
```

### 為什麼選擇 7004？

1. **不常用** - 不會和常見服務衝突
2. **易記** - 700X 系列
3. **避開保留端口** - 不是 80/443/8080 等常見端口
4. **團隊約定** - 統一標準

---

## 🎯 最佳實踐

### DO ✅

```bash
# 1. 始終使用統一端口
http://localhost:7004  ✅

# 2. 書籤只存一個
📌 http://localhost:7004  ✅

# 3. 配置只寫一份
PORT=7004  ✅

# 4. 文檔只說一個端口
"訪問 localhost:7004"  ✅
```

### DON'T ❌

```bash
# 1. 不要為不同環境設不同端口
DEV_PORT=3000  ❌
TEST_PORT=7004  ❌
PROD_PORT=8080  ❌

# 2. 不要直接訪問內部端口
http://localhost:3000  ❌ (前端內部端口)
http://localhost:8080  ❌ (後端內部端口)

# 3. 不要在代碼中寫死端口
fetch('http://localhost:8080/api')  ❌
```

---

## 🧪 測試驗證

### 檢查清單

```bash
# ✅ 開發環境
./run dev
curl http://localhost:7004/health
# 應返回 200

# ✅ 生產環境
./run dev-stop && ./run prod
curl http://localhost:7004/health
# 應返回 200

# ✅ 前端
open http://localhost:7004
# 應正常顯示

# ✅ API
curl http://localhost:7004/api/v1/locations
# 應返回數據

# ✅ WebSocket
wscat -c ws://localhost:7004/ws
# 應連接成功
```

---

## 📚 相關文檔

- [環境配置指南](ENVIRONMENT_SETUP_GUIDE.md)
- [Podman 容器指南](PODMAN_GUIDE.md)
- [快速測試指南](QUICK_START_TESTING_GUIDE.md)

---

## 🎉 總結

### 統一端口三大原則

```
1. 簡單 - 只記一個端口 (7004)
2. 一致 - 所有環境相同
3. 透明 - 用戶無感知切換
```

### 黃金法則

> **7004 是你的唯一端口**
>
> **開發、生產，永遠都是 7004**

---

*統一端口架構指南 | 最後更新: 2025-09-30*