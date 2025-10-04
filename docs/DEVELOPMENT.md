# 開發指南

## 🚀 快速開始

### 使用 Makefile（推薦）

```bash
# 查看所有可用指令
make help

# 啟動開發環境（前端 + 後端 + 資料庫）
make dev

# 查看開發環境日誌
make dev-logs

# 停止開發環境
make dev-down
```

## 📦 容器化開發

### 開發環境管理

所有開發操作都已容器化，**不需要在本機安裝 Go 或 Node.js**：

```bash
# 啟動完整開發環境（熱重載）
make dev

# 查看日誌
make dev-logs

# 重啟開發環境
make dev-restart

# 重新構建容器
make dev-build

# 停止開發環境
make dev-down
```

### 生產環境管理

```bash
# 啟動生產環境（包含前端構建）
make prod

# 查看日誌
make prod-logs

# 重啟生產環境
make prod-restart

# 重新構建容器
make prod-build

# 停止生產環境
make prod-down
```

### 其他實用指令

```bash
# 查看所有容器狀態
make status

# 構建前端靜態檔案（使用容器）
make build-frontend

# 清理所有容器和資料卷（危險！）
make clean
```

## 🛠️ 進階操作

### 直接使用 podman-compose

如果需要更細粒度的控制：

```bash
# 開發環境
podman-compose -f podman-compose.dev.yml up -d
podman-compose -f podman-compose.dev.yml logs -f
podman-compose -f podman-compose.dev.yml down

# 生產環境
podman-compose up -d
podman-compose logs -f
podman-compose down

# 重新構建特定服務
podman-compose -f podman-compose.dev.yml build backend
podman-compose -f podman-compose.dev.yml build frontend
```

### 進入容器內部

```bash
# 進入後端容器
podman exec -it spatial-backend-dev /bin/sh

# 進入前端容器
podman exec -it spatial-frontend-dev /bin/sh

# 進入資料庫
podman exec -it spatial-postgres-dev psql -U spatial_user -d spatial_platform_dev
```

## 🧪 測試

```bash
# 運行後端測試（在開發容器內）
podman exec spatial-backend-dev go test ./internal/... -v -cover

# 運行特定測試
podman exec spatial-backend-dev go test ./internal/game -v

# 格式化程式碼
podman exec spatial-backend-dev go fmt ./...
```

## 📝 本機開發（不推薦）

如果你真的需要在本機直接開發（不使用容器）：

### 前端
```bash
cd web
npm install
npm run dev           # 開發伺服器
npm run build         # 生產構建
npm run type-check    # TypeScript 檢查
```

### 後端
```bash
go run cmd/server/main.go    # 運行開發伺服器
go build cmd/server/main.go  # 構建二進制檔
go test ./...                # 運行測試
go fmt ./...                 # 格式化程式碼
```

**注意**: 本機開發需要：
- Go 1.23+
- Node.js 20+
- PostgreSQL + PostGIS
- 正確配置 .env

## 編碼規範

### Go
- 遵循 `gofmt` 格式化規則
- 使用有意義的變數和函數名稱
- 添加適當的錯誤處理

### TypeScript/JavaScript
- 使用嚴格模式
- 優先使用 TypeScript 型別
- 遵循 ESLint 規則

### CSS
- 優先使用 TailwindCSS 類別
- 避免內聯樣式
- 使用一致的命名規範

## Git 工作流程

```bash
# 檢查狀態
git status

# 添加修改
git add .

# 提交變更
git commit -m "feat: add new feature description"

# 推送到遠端
git push origin main
```

### 提交訊息格式
- `feat:` 新功能
- `fix:` 錯誤修復
- `docs:` 文檔更新
- `style:` 程式碼格式化
- `refactor:` 程式碼重構
- `test:` 測試相關
- `chore:` 其他雜項