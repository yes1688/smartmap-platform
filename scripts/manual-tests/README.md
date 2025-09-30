# 手動測試腳本

> 這些是臨時的手動測試腳本，用於開發過程中的快速驗證

## 檔案說明

- `test_movement.go` - 測試移動指令解析邏輯
- `test_ai_coordinates.go` - 測試 AI 座標回應
- `test_places.go` - 測試 Google Places API
- `test_taiwan_bounds.go` - 測試台灣邊界座標

## 使用方式

```bash
# 運行單一測試
go run scripts/manual-tests/test_movement.go

# 或進入目錄運行
cd scripts/manual-tests
go run test_movement.go
```

## ⚠️ 注意事項

- 這些是**臨時測試腳本**，不是正式測試
- 不會被 CI/CD 執行
- 建議改寫成正式的單元測試放在 `internal/*/` 目錄

## 建議

應該將這些測試邏輯整合到：
- `internal/game/service_test.go` - 移動相關測試
- `internal/geo/service_test.go` - 地理服務測試
- `internal/ai/service_test.go` - AI 相關測試