# 開發指南

## 前端開發

### 推薦方式：容器開發
```bash
# 啟動前端開發容器
podman-compose up -d frontend

# 查看前端日誌
podman-compose logs -f frontend

# 重啟前端容器
podman-compose restart frontend

# 停止前端容器
podman-compose stop frontend
```

### 傳統方式（僅在容器有問題時使用）
```bash
cd web

# ⚠️ 重要：必須先關閉所有佔用 port 3000 的進程
pkill -f "npm run dev" && pkill -f "vite"

# 確保使用 port 3000，禁止自動切換端口
PORT=3000 npm run dev

# 其他前端指令
npm run build           # 生產構建
npm run preview         # 預覽構建結果
npm run type-check      # TypeScript 檢查
```

## 後端開發

```bash
# 運行開發服務器
go run cmd/server/main.go

# 構建二進制檔
go build cmd/server/main.go

# 運行測試
go test ./...

# 格式化代碼
go fmt ./...
```

## 容器操作

### 正常容器操作（建議使用）
```bash
# 啟動所有服務
podman-compose up -d

# 僅啟動前端開發服務器
podman-compose up -d frontend

# 僅啟動後端服務器
podman-compose up -d backend

# 重新構建映像
podman-compose build

# 構建並啟動
podman-compose up --build

# 查看應用日誌
podman-compose logs -f app

# 查看前端日誌
podman-compose logs -f frontend

# 檢查服務狀態
podman-compose ps

# 停止所有服務
podman-compose down
```

### 問題排除構建（僅問題時使用）
```bash
# 強制重建應用容器（清除快取）
podman-compose build app --no-cache

# 強制重建前端容器（清除快取）
podman-compose build frontend --no-cache

# 構建並啟動所有服務
podman-compose up -d --build
```

**注意**: `--no-cache` 會顯著增加構建時間，僅在以下情況使用：
- 之前構建失敗並留下問題快取
- 重要代碼修改後構建異常
- 新依賴或模組無法正確載入

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