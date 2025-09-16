# 問題排除指南

## 常見問題

### 1. 前端開發服務器問題

#### 問題：Port 3000 被佔用
```bash
# 解決方案：關閉佔用進程
pkill -f "npm run dev"
pkill -f "vite"

# 檢查端口使用情況
netstat -tlnp | grep :3000
# 或使用
ss -tlnp | grep :3000
```

#### 問題：Vite 自動切換到其他端口
```bash
# 解決方案：強制使用 port 3000
PORT=3000 npm run dev

# 或更好的解決方案：使用容器
podman-compose up -d frontend
```

### 2. 地圖顯示問題

#### 問題：地圖底圖無法載入
- **檢查網路連接**：確保可以存取外部磁磚服務
- **檢查控制台錯誤**：查看瀏覽器 DevTools 的 Network 標籤
- **檢查地圖服務狀態**：確認 ESRI 或其他地圖服務正常

#### 問題：MapLibre GL CSS 缺失
```bash
# 確保 CSS 已正確導入 (在 index.tsx)
import 'maplibre-gl/dist/maplibre-gl.css';
```

### 3. 兔子角色顯示問題

#### 問題：兔子不顯示在地圖上
- **檢查玩家資料**：確認 `gameStore.currentPlayer` 有正確的座標
- **檢查控制台日誌**：搜索 🐰 emoji 相關的日誌
- **檢查 Deck.gl 圖層**：確認 IconLayer 正確創建

### 4. API 服務問題

#### 問題：API 回應 HTML 而非 JSON
- **檢查後端服務狀態**：確認 Go 服務器正在運行
- **檢查端口衝突**：確認沒有其他服務佔用 API 端口
- **檢查路由配置**：驗證 API 端點路由正確

### 5. 容器問題

#### 問題：容器啟動失敗
```bash
# 檢查 Podman 安裝
podman version

# 檢查容器狀態
podman-compose ps

# 查看詳細錯誤日誌
podman-compose logs -f [service_name]
```

#### 問題：容器權限問題
```bash
# 檢查 Podman 權限設定
podman info

# 重新啟動 Podman 服務
systemctl --user restart podman
```

## 除錯指令

### 檢查服務狀態
```bash
# 檢查前端服務
curl http://localhost:3000/

# 檢查後端健康狀態
curl http://localhost:8080/health

# 檢查 API 端點
curl http://localhost:8080/api/v1/game/status
```

### 查看日誌
```bash
# 查看容器狀態
podman-compose ps

# 查看前端日誌
podman-compose logs -f frontend

# 查看後端日誌
podman-compose logs -f backend

# 查看所有服務日誌
podman-compose logs -f
```

### 重置環境
```bash
# 停止所有容器
podman-compose down

# 清理容器和映像
podman system prune -f

# 重新構建和啟動
podman-compose up --build -d
```

## 效能問題

### 前端效能優化
- 檢查 Vite HMR 是否正常工作
- 確認 TailwindCSS JIT 編譯生效
- 監控瀏覽器記憶體使用量

### 後端效能優化
- 檢查資料庫連接池設定
- 監控 Go 應用記憶體使用
- 檢查 API 回應時間

## 緊急重置

如果遇到無法解決的問題，可以執行完整重置：

```bash
# 1. 停止所有服務
podman-compose down

# 2. 清理前端依賴
cd web && rm -rf node_modules && npm install

# 3. 清理容器環境
podman system prune -a -f

# 4. 重新啟動
podman-compose up --build -d
```

## 聯絡支援

如果問題仍然無法解決，請提供：
1. 錯誤訊息的完整截圖
2. 相關的控制台日誌
3. 系統環境資訊（OS、Node.js、Go 版本）
4. 重現問題的具體步驟