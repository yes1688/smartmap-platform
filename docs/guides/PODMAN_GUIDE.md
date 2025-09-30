# Podman Compose 統一管理指南

## 概述

此專案現在使用統一的 `podman-compose.yml` 配置文件來管理開發和生產環境，透過 Docker Compose profiles 機制來區分不同的運行模式。

## 架構說明

### 開發模式 (`dev` profile)
- **前端**: 使用 Vite 開發服務器，支援熱重載
- **後端**: 使用 Air 熱重載工具，支援 Go 代碼實時編譯
- **數據庫**: PostgreSQL with PostGIS
- **端口直接暴露**: 前端 3000，後端 8080
- **源代碼掛載**: 支援實時編輯

### 生產模式 (`prod` profile)
- **前端**: 編譯為靜態文件，透過 nginx 服務
- **後端**: 多階段構建，最佳化的 Go 二進制文件
- **數據庫**: PostgreSQL with PostGIS
- **反向代理**: nginx (端口 7003)
- **內部隔離**: 服務間透過內部網路通訊

## 使用方式

### 開發環境

```bash
# 啟動開發環境 (前端 + 後端 + 數據庫)
podman-compose --profile dev up

# 背景運行開發環境
podman-compose --profile dev up -d

# 查看開發環境日誌
podman-compose --profile dev logs -f

# 只啟動特定服務 (例如只啟動前端)
podman-compose --profile dev up frontend-dev

# 停止開發環境
podman-compose --profile dev down
```

### 生產環境

```bash
# 啟動生產環境 (需要先構建前端)
npm run build -w web
podman-compose --profile prod up

# 背景運行生產環境
podman-compose --profile prod up -d

# 查看生產環境日誌
podman-compose --profile prod logs -f

# 停止生產環境
podman-compose --profile prod down
```

### 常用管理指令

```bash
# 查看所有容器狀態
podman-compose ps

# 重新構建容器 (開發環境)
podman-compose --profile dev build

# 重新構建容器 (生產環境)
podman-compose --profile prod build

# 清理所有容器和卷
podman-compose down -v

# 查看容器日誌
podman-compose logs [service-name]

# 進入容器 shell
podman-compose exec [service-name] sh
```

## 環境變數配置

建議在 `.env` 文件中設置以下變數：

```env
# 數據庫配置
DB_NAME=spatial_db
DB_USER=spatial_user
DB_PASSWORD=your_secure_password

# 服務端口
APP_PORT=8080
FRONTEND_DEV_PORT=3000
PORT=7003

# AI 模型配置
OLLAMA_URL=http://host.containers.internal:11434
OLLAMA_MODEL=gemma3:12b-it-qat

# API Keys (請使用安全的值)
GOOGLE_PLACES_API_KEY=your_google_places_key
```

## 熱重載功能

### 前端熱重載
- 修改 `web/src/` 下的任何文件會自動觸發重新編譯
- 瀏覽器會自動刷新頁面
- 支援 SolidJS、TypeScript、CSS 的實時更新

### 後端熱重載
- 修改 `internal/`、`cmd/`、`configs/` 下的 Go 文件會自動重新編譯
- 使用 Air 工具提供快速的增量編譯
- 支援 Go 代碼、配置文件的實時更新

## 故障排除

### 常見問題

1. **端口衝突**
   ```bash
   # 檢查端口佔用
   sudo netstat -tulpn | grep :3000

   # 修改 .env 文件中的端口設置
   FRONTEND_DEV_PORT=3001
   ```

2. **容器構建失敗**
   ```bash
   # 清理構建快取
   podman system prune -a

   # 重新構建
   podman-compose --profile dev build --no-cache
   ```

3. **數據庫連接失敗**
   ```bash
   # 檢查數據庫容器狀態
   podman-compose logs postgres

   # 重啟數據庫
   podman-compose restart postgres
   ```

4. **前端無法連接後端**
   ```bash
   # 確認環境變數設置正確
   echo $VITE_API_BASE_URL

   # 檢查後端健康狀態
   curl http://localhost:8080/health
   ```

## 開發工作流程

### 日常開發
```bash
# 1. 啟動開發環境
podman-compose --profile dev up -d

# 2. 查看服務狀態
podman-compose ps

# 3. 開始編碼 (自動熱重載)
# 前端: http://localhost:3000
# 後端 API: http://localhost:8080

# 4. 停止開發環境
podman-compose --profile dev down
```

### 生產部署
```bash
# 1. 構建前端資源
npm run build -w web

# 2. 啟動生產環境
podman-compose --profile prod up -d

# 3. 檢查服務健康狀態
curl http://localhost:7003/health

# 4. 檢查所有服務
podman-compose --profile prod ps
```

## 性能最佳化

### 開發環境
- 使用 `.dockerignore` 減少構建上下文
- 利用 Docker layer 快取機制
- 掛載源代碼避免重複複製

### 生產環境
- 多階段構建減少映像大小
- 使用 Alpine Linux 基底映像
- 啟用 gzip 壓縮 (nginx)
- 設置適當的健康檢查

## 安全考量

1. **環境變數管理**
   - 敏感資訊不要寫在 `podman-compose.yml`
   - 使用 `.env` 文件，確保已加入 `.gitignore`

2. **網路隔離**
   - 生產環境服務間使用內部網路
   - 只暴露必要的端口

3. **容器安全**
   - 使用非 root 用戶運行應用
   - 定期更新基底映像

---

## 總結

統一的 podman-compose 管理方案提供了：

✅ **開發效率**: 熱重載支援，快速迭代
✅ **生產就緒**: 最佳化構建，nginx 反向代理
✅ **一致性**: 相同的容器環境，減少"在我機器上可以運行"問題
✅ **靈活性**: 透過 profiles 輕鬆切換環境
✅ **可維護性**: 單一配置文件，統一管理

使用 `podman-compose --profile dev up` 開始開發，使用 `podman-compose --profile prod up` 進行生產部署。