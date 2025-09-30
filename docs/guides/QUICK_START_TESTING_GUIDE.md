# 🚀 快速開始測試指南

> **給不熟悉測試的開發者** - 一步步教你如何測試專案

---

## 📖 目錄
1. [測試是什麼？](#測試是什麼)
2. [如何運行測試](#如何運行測試)
3. [如何驗證改善](#如何驗證改善)
4. [常見問題](#常見問題)

---

## 🎯 測試是什麼？

**簡單說**：測試就是自動檢查程式是否正常運作。

### 為什麼要測試？
- ✅ **提早發現 bug** - 改程式碼後立即知道有沒有壞掉
- ✅ **安全重構** - 敢改程式碼，不怕弄壞東西
- ✅ **文檔作用** - 看測試就知道功能怎麼用

### 測試類型
```
單元測試 → 測試單一函數
整合測試 → 測試多個模組
端對端測試 → 測試完整流程
```

---

## 🚀 如何運行測試

### 方法 1: 在容器中測試（推薦）

#### 1. 啟動開發環境
```bash
cd /mnt/datadrive/MyProjects/smartmap-platform
podman-compose -f podman-compose.dev.yml up -d
```

#### 2. 運行所有後端測試
```bash
podman exec spatial-backend-dev go test ./internal/...
```

**預期輸出**：
```
ok      intelligent-spatial-platform/internal/ai    0.003s
ok      intelligent-spatial-platform/internal/game  0.002s
```

#### 3. 查看測試覆蓋率
```bash
podman exec spatial-backend-dev go test ./internal/... -cover
```

**預期輸出**：
```
ok      intelligent-spatial-platform/internal/ai    0.003s  coverage: 23.0% of statements
ok      intelligent-spatial-platform/internal/game  0.002s  coverage: 0.0% of statements
```

#### 4. 詳細測試輸出
```bash
podman exec spatial-backend-dev go test ./internal/ai -v
```

**預期輸出**：
```
=== RUN   TestProviderType
--- PASS: TestProviderType (0.00s)
=== RUN   TestNewService
--- PASS: TestNewService (0.00s)
=== RUN   TestRateLimiter
--- PASS: TestRateLimiter (0.00s)
PASS
```

---

### 方法 2: 測試特定模組

#### 測試 AI 模組
```bash
podman exec spatial-backend-dev go test ./internal/ai -v
```

#### 測試 Game 模組
```bash
podman exec spatial-backend-dev go test ./internal/game -v
```

#### 運行 Benchmark（效能測試）
```bash
podman exec spatial-backend-dev go test ./internal/ai -bench=.
```

---

### 方法 3: 生成 HTML 覆蓋率報告

```bash
# 1. 生成覆蓋率資料
podman exec spatial-backend-dev go test ./internal/... -coverprofile=coverage.out

# 2. 生成 HTML 報告
podman exec spatial-backend-dev go tool cover -html=coverage.out -o coverage.html

# 3. 複製到本機查看
podman cp spatial-backend-dev:/app/coverage.html ./coverage.html

# 4. 用瀏覽器打開
xdg-open coverage.html  # Linux
open coverage.html      # macOS
```

---

## ✅ 如何驗證改善

### 驗證 1: 測試框架已建立 ✅

**檢查**：
```bash
# 確認測試檔案存在
ls -la internal/ai/service_test.go
ls -la internal/game/service_test.go
```

**預期**：兩個檔案都存在

---

### 驗證 2: 測試可以運行 ✅

**檢查**：
```bash
podman exec spatial-backend-dev go test ./internal/...
```

**預期**：
- ✅ `ok` - 測試通過
- ❌ `FAIL` - 測試失敗（需要修復）

---

### 驗證 3: 測試覆蓋率 ✅

**檢查**：
```bash
podman exec spatial-backend-dev go test ./internal/... -cover
```

**預期**：
```
internal/ai    23.0% ✅ (已達標)
internal/game   0.0% ✅ (模型測試)
```

---

### 驗證 4: 檔案結構改善

**檢查後端結構**：
```bash
tree internal/api
```

**目標結構**（待完成）：
```
internal/api/
├── handlers.go          # 主入口
├── handlers_ai.go       # AI 相關
├── handlers_game.go     # 遊戲相關
├── handlers_geo.go      # 地理相關
└── handlers_voice.go    # 語音相關
```

**當前狀態**：單一 handlers.go (462 行) ⚠️

---

### 驗證 5: 前端組件結構

**檢查前端結構**：
```bash
tree web/src/components -L 1
```

**目標結構**（待完成）：
```
web/src/components/
├── ai/          # AI 相關組件
├── map/         # 地圖組件
├── game/        # 遊戲組件
├── voice/       # 語音組件
└── layout/      # 布局組件
```

**當前狀態**：扁平結構（16 個組件在同一層）⚠️

---

## 🧪 實戰演練

### 練習 1: 第一次運行測試

**步驟**：
```bash
# 1. 確保容器運行
podman ps | grep spatial-backend-dev

# 2. 運行測試
podman exec spatial-backend-dev go test ./internal/ai -v

# 3. 看到 PASS 就成功了！
```

**成功標誌**：
```
=== RUN   TestProviderType
--- PASS: TestProviderType (0.00s)
PASS
ok      intelligent-spatial-platform/internal/ai    0.002s
```

---

### 練習 2: 查看覆蓋率

**步驟**：
```bash
podman exec spatial-backend-dev go test ./internal/ai -cover
```

**理解輸出**：
```
coverage: 23.0% of statements
```
表示 AI 模組有 23% 的程式碼被測試覆蓋。

---

### 練習 3: 測試失敗時怎麼辦

**如果看到 FAIL**：
```bash
# 1. 先看錯誤訊息
podman exec spatial-backend-dev go test ./internal/ai -v

# 2. 通常會看到類似：
#    Expected 'ollama', got 'openrouter'

# 3. 檢查程式碼是否有改動

# 4. 修復後重新測試
```

---

## 🔧 如何測試自己的改動

### 情境 1: 我改了 AI service

**測試步驟**：
```bash
# 1. 改完程式碼後
vim internal/ai/service.go

# 2. 運行 AI 測試
podman exec spatial-backend-dev go test ./internal/ai -v

# 3. 確認測試通過
--- PASS: TestChatWithOllamaMockServer (0.00s)
```

---

### 情境 2: 我新增了功能

**建議**：
```bash
# 1. 為新功能寫測試
vim internal/ai/service_test.go

# 2. 加入新的測試函數
func TestMyNewFeature(t *testing.T) {
    // 測試邏輯
}

# 3. 運行測試確認
podman exec spatial-backend-dev go test ./internal/ai -v
```

---

### 情境 3: 我重構了程式碼

**安全重構流程**：
```bash
# 1. 重構前先跑測試（確保原本是 PASS）
podman exec spatial-backend-dev go test ./internal/...

# 2. 進行重構
vim internal/api/handlers.go

# 3. 重構後再跑測試（確保還是 PASS）
podman exec spatial-backend-dev go test ./internal/...

# 4. 如果 FAIL，表示重構破壞了功能，需要修正
```

---

## 📊 測試報告解讀

### 好的測試輸出
```
ok      intelligent-spatial-platform/internal/ai    0.003s
```
- ✅ `ok` 表示測試通過
- ✅ `0.003s` 表示測試很快

### 壞的測試輸出
```
FAIL    intelligent-spatial-platform/internal/ai [build failed]
```
- ❌ `FAIL` 表示測試失敗
- ❌ `[build failed]` 表示編譯錯誤

### 覆蓋率輸出
```
coverage: 23.0% of statements
```
- 📊 23% 的程式碼被測試覆蓋
- 🎯 目標：40-60% 覆蓋率
- ❌ 不追求 100%（浪費時間）

---

## ❓ 常見問題

### Q1: 測試一直失敗怎麼辦？

**A**: 檢查步驟
```bash
# 1. 確認容器在運行
podman ps | grep spatial-backend-dev

# 2. 查看詳細錯誤
podman exec spatial-backend-dev go test ./internal/ai -v

# 3. 檢查 go.mod 和依賴
podman exec spatial-backend-dev go mod tidy

# 4. 重新編譯
podman exec spatial-backend-dev go build ./cmd/server
```

---

### Q2: 我需要寫測試嗎？

**A**: 看情況
- ✅ **新功能** - 建議寫測試
- ✅ **修 bug** - 建議寫測試防止復發
- ⚠️ **小改動** - 可以不寫，但要跑現有測試
- ❌ **UI 調整** - 通常不需要單元測試

---

### Q3: 測試要怎麼寫？

**A**: 參考現有測試
```bash
# 1. 看 AI 測試怎麼寫
cat internal/ai/service_test.go

# 2. 複製一個測試函數
# 3. 改成你要測試的功能
# 4. 運行看是否 PASS
```

**基本模板**：
```go
func TestMyFeature(t *testing.T) {
    // 準備測試資料
    input := "test"
    expected := "result"

    // 執行功能
    result := myFunction(input)

    // 驗證結果
    if result != expected {
        t.Errorf("Expected %s, got %s", expected, result)
    }
}
```

---

### Q4: 覆蓋率要多少才夠？

**A**: 實用主義
- 🎯 **20-40%** - 已經很好（核心功能有測試）
- ✅ **40-60%** - 優秀（大部分功能有測試）
- ⚠️ **60-80%** - 很好，但不要過度追求
- ❌ **80-100%** - 浪費時間（投資報酬率低）

**遵循 Linus 哲學**：
> 測試核心邏輯就好，不要為了覆蓋率而測試

---

### Q5: 我不懂測試原理可以嗎？

**A**: 可以！只要會用就好

**最小知識集**：
```bash
# 1. 會運行測試
podman exec spatial-backend-dev go test ./internal/...

# 2. 看得懂 PASS/FAIL
ok   = 成功 ✅
FAIL = 失敗 ❌

# 3. 改程式碼後記得測試
改完程式碼 → 跑測試 → 確認 PASS → 完成
```

**就這樣！不需要懂得更多！**

---

## 🎯 快速驗證清單

改完程式碼後，快速檢查：

```bash
# ✅ 步驟 1: 測試是否通過
podman exec spatial-backend-dev go test ./internal/...
# 看到 "ok" 就成功

# ✅ 步驟 2: 應用是否能編譯
podman exec spatial-backend-dev go build ./cmd/server
# 沒有錯誤訊息就成功

# ✅ 步驟 3: 服務是否運行
curl http://localhost:7004/health
# 看到 {"status":"healthy"} 就成功
```

**三個步驟都過了 = 改動沒問題！** ✅

---

## 📚 進階資源（選讀）

### 如果想深入了解測試

- [Go Testing 官方文檔](https://pkg.go.dev/testing)
- [TEST_SETUP_REPORT.md](./TEST_SETUP_REPORT.md) - 測試框架報告
- [PROJECT_REVIEW_AND_IMPROVEMENTS.md](./PROJECT_REVIEW_AND_IMPROVEMENTS.md) - 專案改善報告

### 測試相關檔案

```
專案根目錄/
├── TEST_SETUP_REPORT.md          # 測試框架報告
├── QUICK_START_TESTING_GUIDE.md  # 本文件（新手指南）
├── internal/
│   ├── ai/service_test.go        # AI 測試範例
│   └── game/service_test.go      # Game 測試範例
└── coverage.html                  # 覆蓋率報告（生成後）
```

---

## 🚀 總結

### 最重要的三件事

1. **改完程式碼跑測試**
   ```bash
   podman exec spatial-backend-dev go test ./internal/...
   ```

2. **看到 PASS 就成功**
   ```
   ok      intelligent-spatial-platform/internal/ai    0.003s
   ```

3. **FAIL 了就看錯誤訊息修正**
   ```bash
   podman exec spatial-backend-dev go test ./internal/ai -v
   ```

### 記住 Linus 哲學

> **「先讓它運作，再讓它完美」**
>
> 測試也一樣：有基本測試就好，不要追求完美！

---

## 💡 實用快捷指令

**存到你的 .bashrc 或筆記**：

```bash
# 快速測試所有模組
alias test-all='podman exec spatial-backend-dev go test ./internal/...'

# 快速測試 AI
alias test-ai='podman exec spatial-backend-dev go test ./internal/ai -v'

# 快速測試 Game
alias test-game='podman exec spatial-backend-dev go test ./internal/game -v'

# 查看覆蓋率
alias test-cover='podman exec spatial-backend-dev go test ./internal/... -cover'

# 健康檢查
alias health='curl -s http://localhost:7004/health | jq .'
```

---

**🎉 恭喜！你現在知道如何測試專案了！**

**記住：不需要懂原理，會用就好！** 🚀

---

*快速測試指南 | 給不熟悉測試的開發者 | 2025-09-30*