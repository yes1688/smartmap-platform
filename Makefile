# Intelligent Spatial Platform - Makefile
# 智慧空間平台 - 統一操作指令

.PHONY: help dev prod dev-down prod-down dev-restart prod-restart dev-logs prod-logs dev-build prod-build build-frontend clean status

# 預設目標 - 顯示幫助訊息
help:
	@echo "智慧空間平台 - 可用指令："
	@echo ""
	@echo "開發環境："
	@echo "  make dev           - 啟動開發環境（支援熱重載）"
	@echo "  make dev-down      - 停止開發環境"
	@echo "  make dev-restart   - 重啟開發環境"
	@echo "  make dev-logs      - 查看開發環境日誌"
	@echo "  make dev-build     - 重新構建開發環境容器"
	@echo ""
	@echo "生產環境："
	@echo "  make prod          - 啟動生產環境"
	@echo "  make prod-down     - 停止生產環境"
	@echo "  make prod-restart  - 重啟生產環境"
	@echo "  make prod-logs     - 查看生產環境日誌"
	@echo "  make prod-build    - 重新構建生產環境容器"
	@echo ""
	@echo "構建："
	@echo "  make build-frontend - 構建前端靜態檔案"
	@echo ""
	@echo "其他："
	@echo "  make status        - 查看所有容器狀態"
	@echo "  make clean         - 清理所有容器和資料卷（危險！）"
	@echo ""

# ============================================
# 開發環境指令
# ============================================

dev:
	@echo "🚀 啟動開發環境（支援熱重載）..."
	podman-compose -f podman-compose.dev.yml up -d
	@echo "✅ 開發環境已啟動"
	@echo "📍 統一訪問網址: http://localhost:7003"
	@echo "   - 前端應用: http://localhost:7003/"
	@echo "   - 後端 API: http://localhost:7003/api/v1"
	@echo "   - WebSocket: ws://localhost:7003/ws"
	@echo "   - 健康檢查: http://localhost:7003/health"

dev-down:
	@echo "🛑 停止開發環境..."
	podman-compose -f podman-compose.dev.yml down
	@echo "✅ 開發環境已停止"

dev-restart:
	@echo "🔄 重啟開發環境..."
	podman-compose -f podman-compose.dev.yml restart
	@echo "✅ 開發環境已重啟"

dev-logs:
	@echo "📋 查看開發環境日誌（Ctrl+C 退出）..."
	podman-compose -f podman-compose.dev.yml logs -f

dev-build:
	@echo "🔨 重新構建開發環境容器..."
	podman-compose -f podman-compose.dev.yml build
	@echo "✅ 開發環境容器構建完成"

# ============================================
# 生產環境指令
# ============================================

prod:
	@echo "🚀 啟動生產環境（包含前端構建）..."
	podman-compose up -d --build
	@echo "✅ 生產環境已啟動"
	@echo "📍 訪問網址: http://localhost:7003"

prod-down:
	@echo "🛑 停止生產環境..."
	podman-compose down
	@echo "✅ 生產環境已停止"

prod-restart:
	@echo "🔄 重啟生產環境（包含 app 和 nginx）..."
	podman-compose restart app nginx
	@echo "✅ 生產環境已重啟"

prod-logs:
	@echo "📋 查看生產環境日誌（Ctrl+C 退出）..."
	podman-compose logs -f

prod-build:
	@echo "🔨 重新構建生產環境容器（包含前端）..."
	podman-compose build
	@echo "✅ 生產環境容器構建完成"

# ============================================
# 構建指令
# ============================================

build-frontend:
	@echo "🔨 構建前端靜態檔案（使用容器）..."
	podman-compose build frontend-builder
	@echo "✅ 前端容器構建完成"

# ============================================
# 其他指令
# ============================================

status:
	@echo "📊 容器狀態："
	@podman ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "spatial|NAME"

clean:
	@echo "⚠️  警告：此操作將刪除所有容器和資料卷！"
	@read -p "確定要繼續嗎？(yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "🗑️  清理開發環境..."; \
		podman-compose -f podman-compose.dev.yml down -v; \
		echo "🗑️  清理生產環境..."; \
		podman-compose down -v; \
		echo "✅ 清理完成"; \
	else \
		echo "❌ 已取消"; \
	fi
