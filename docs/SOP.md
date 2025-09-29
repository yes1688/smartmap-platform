# 📋 智慧空間平台 - 標準作業程序 (SOP)

## 📖 文檔概述
**文檔名稱**: 標準作業程序 (Standard Operating Procedures)
**適用專案**: 智慧空間平台 (Intelligent Spatial Platform)
**技術棧**: Go + CesiumJS + PostgreSQL + Ollama + WebSocket
**文檔版本**: v1.0

## 🎯 SOP 目的
- 標準化專案管理流程，確保一致性和品質
- 提供清楚的操作指引，減少錯誤和遺漏
- 支援團隊成員快速上手
- 持續改進專案管理效率

---

## 📋 SOP-001: 計畫建立標準程序 (5分鐘)

### 步驟 1: 獲取時間戳
```bash
# 獲取當前時間戳 (格式: YYYYMMDD_HHMMSS)
date +"%Y%m%d_%H%M%S"
```

### 步驟 2: 選擇正確模板
- **技術實作計畫**: 使用 `templates/PLAN_TEMPLATE.md`
- **分析報告**: 使用 `templates/ANALYSIS_TEMPLATE.md`

### 步驟 3: 建立計畫檔案
```bash
# 複製模板並重新命名
cp docs/templates/PLAN_TEMPLATE.md "docs/plans/active/YYYYMMDD_HHMMSS_Plan_Name.md"
```

### 步驟 4: 填寫核心內容 (必填項目)
1. **計畫ID** 和 **計畫名稱**
2. **優先級** (🔴高/🟡中/🟢低)
3. **預計完成日期**
4. **問題定義與目標** (核心重點)
5. **實作階段規劃** (具體可執行)

### 步驟 5: 品質檢查與索引更新
- [ ] 檢查檔案命名格式正確
- [ ] 核心內容已填寫完整
- [ ] 檔案已存放到 `plans/active/` 目錄
- [ ] 已更新 `PROJECT_INDEX.md` 索引

---

## 📋 SOP-002: 狀態管理程序

### 生命週期
```
🟢 ACTIVE → ✅ COMPLETED → (30天後) → 📦 ARCHIVED
         ↘ ❌ CANCELLED
```

### 狀態變更操作
1. 更新計畫文檔狀態
2. 移動檔案到對應目錄
3. 更新 PROJECT_INDEX.md
4. 記錄變更原因和日期

### 常見狀態變更範例
```bash
# 完成計畫
mv docs/plans/active/20250914_143000_Feature_Development.md docs/plans/completed/

# 取消計畫
mv docs/plans/active/20250914_144500_Deprecated_Feature.md docs/plans/cancelled/

# 歸檔舊計畫
mv docs/plans/completed/20250814_* docs/plans/archived/
```

---

## 📋 SOP-003: 智慧空間平台專案特殊程序

### 開發環境啟動
```bash
# 啟動開發環境
./scripts/dev-setup.sh

# 檢查服務狀態
podman-compose ps

# 訪問應用程式
open http://localhost:3000
```

### 程式碼提交前檢查
```bash
# 格式化 Go 程式碼
go fmt ./...

# 執行測試
go test ./...

# 建構檢查
go build cmd/server/main.go

# 前端檢查 (如果有修改)
cd web && npm run lint
```

### API 開發流程
1. 在 `internal/api/` 新增路由處理器
2. 更新 API 文檔 (README.md API 章節)
3. 撰寫單元測試
4. 測試 WebSocket 整合

### 3D 地圖功能開發
1. 確認 CesiumJS 版本相容性
2. 測試 CESIUM_ACCESS_TOKEN 有效性
3. 驗證地理資料格式
4. 檢查 PostGIS 空間查詢功能

### AI 功能開發
1. 確認 Ollama 服務運行
2. 測試模型載入狀態
3. 驗證中文對話品質
4. 檢查語音整合功能

---

## 📋 SOP-004: 品質檢查清單

### 建立計畫檢查清單
- [ ] **時間戳格式**: YYYYMMDD_HHMMSS 格式正確
- [ ] **檔案命名**: 使用英文，避免特殊字符
- [ ] **必填欄位**: 計畫ID、名稱、優先級已填寫
- [ ] **目標明確**: 問題定義和解決目標清楚
- [ ] **可執行性**: 實作階段具體可操作
- [ ] **索引更新**: PROJECT_INDEX.md 已同步更新

### 智慧空間平台特殊檢查
- [ ] **技術相容性**: 與現有 Go/CesiumJS 架構相容
- [ ] **容器整合**: 確認 Podman 容器配置正確
- [ ] **API 一致性**: 符合 RESTful 設計原則
- [ ] **WebSocket 支援**: 即時通訊功能正常
- [ ] **地理資料**: PostGIS 查詢效能良好
- [ ] **AI 整合**: Ollama 服務整合無誤

---

## 📋 SOP-005: 緊急應變程序

### 系統故障處理
1. **檢查服務狀態**
```bash
# 快速診斷
curl http://localhost:3000/health
podman-compose ps
```

2. **查看錯誤日誌**
```bash
# 應用程式日誌
podman-compose logs -f app

# 資料庫日誌
podman-compose logs -f postgres

# AI 服務日誌
podman-compose logs -f ollama
```

3. **緊急重啟**
```bash
# 重啟單一服務
podman-compose restart app

# 完整重啟
podman-compose down && podman-compose up -d
```

### 資料備份程序
```bash
# 資料庫備份
podman exec spatial-postgres pg_dump -U spatial_user spatial_platform_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# 檔案備份
tar -czf docs_backup_$(date +%Y%m%d_%H%M%S).tar.gz docs/
```

---

## 📋 SOP-006: 效能監控程序

### 日常監控指標
- [ ] **容器資源使用**: `podman stats`
- [ ] **資料庫效能**: PostGIS 查詢時間 < 100ms
- [ ] **API 回應時間**: REST API < 200ms
- [ ] **WebSocket 連線**: 同時連線數監控
- [ ] **AI 服務**: Ollama 模型回應時間

### 週期性檢查
```bash
# 每週執行
# 1. 資料庫最佳化
podman exec spatial-postgres psql -U spatial_user -d spatial_platform_dev -c "VACUUM ANALYZE;"

# 2. 日誌清理
find logs/ -name "*.log" -mtime +7 -delete

# 3. 容器映像更新檢查
podman images --format "table {{.Repository}} {{.Tag}} {{.Created}}"
```

---

## 📋 SOP-007: 部署與發布程序

### 開發環境部署
```bash
# 標準開發部署
./scripts/dev-setup.sh

# 驗證部署成功
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/locations
```

### 生產環境部署
```bash
# 切換環境變數
cp .env.prod .env

# 執行生產部署
./scripts/production-deploy.sh

# 健康檢查
curl https://your-domain.com/health
```

### 版本發布檢查清單
- [ ] 所有測試通過
- [ ] 文檔已更新
- [ ] 資料庫遷移已執行
- [ ] 環境變數已設定
- [ ] 備份已完成
- [ ] 監控已配置

---

## 🔧 工具與資源

### 必要工具
- **Go 1.21+**: 主要開發語言
- **Podman**: 容器管理工具
- **Git**: 版本控制
- **VS Code**: 推薦編輯器

### 有用的指令
```bash
# 快速狀態檢查
alias spatial-status="podman-compose ps && curl -s http://localhost:3000/health"

# 快速日誌查看
alias spatial-logs="podman-compose logs -f"

# 快速重啟
alias spatial-restart="podman-compose restart app"
```

### 相關文檔連結
- [PROJECT_INDEX.md](./PROJECT_INDEX.md) - 計畫索引中心
- [README.md](../README.md) - 專案主要文檔
- [API 文檔](../README.md#API文檔) - REST API 說明

---

*版本: v1.0 | 維護者: 開發團隊 | 最後更新: 2025-09-14*