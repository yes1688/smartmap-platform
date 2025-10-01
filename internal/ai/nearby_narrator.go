package ai

import (
	"fmt"
	"strings"

	"intelligent-spatial-platform/internal/geo"
)

// NearbyNarrator AI 附近搜尋結果敘述生成器
type NearbyNarrator struct {
	ai *Service
}

func NewNearbyNarrator(ai *Service) *NearbyNarrator {
	return &NearbyNarrator{ai: ai}
}

// GenerateNarration 生成自然語言的搜尋結果描述
func (n *NearbyNarrator) GenerateNarration(
	results *geo.NearbySearchResult,
	categoryName string,
) (string, error) {

	// 如果沒有結果
	if results.Total == 0 {
		return fmt.Sprintf("😅 抱歉，附近 %.0f 公尺內沒有找到%s",
			results.Radius, categoryName), nil
	}

	// 構建結果列表文字
	resultList := ""
	top3 := results.Locations
	if len(top3) > 3 {
		top3 = top3[:3] // 只取前 3 個
	}

	for i, loc := range top3 {
		direction := geo.GetDirectionDescription(loc.Bearing)
		distance := geo.FormatDistance(loc.Distance)
		// Rating is optional, not all locations have ratings
		resultList += fmt.Sprintf("%d. %s（%s方向，距離 %s）\n",
			i+1, loc.Name, direction, distance)
	}

	// 構建 AI Prompt
	prompt := fmt.Sprintf(`你是友善的 AI 導覽助手。用戶剛才搜尋了「附近的%s」，以下是搜尋結果：

找到數量：%d 個
搜尋半徑：%.0f 公尺

前 3 個結果：
%s

請生成一段 50-80 字的輕鬆活潑回應（台灣用語）：
1. 開頭說找到幾個結果
2. 重點推薦前 2-3 個（提到名稱、距離、特色）
3. 語氣親切、加上合適的 emoji

範例風格：
"幫你找到 5 家餐廳！😋 最近的是【阿里山茶飲】只要 200 公尺，還有【台南牛肉湯】走路 5 分鐘就到～"

請直接回答，不要有「我建議」「我認為」等開頭。`,
		categoryName,
		results.Total,
		results.Radius,
		resultList,
	)

	// 呼叫 AI 生成
	response, err := n.ai.Chat(prompt, "你是專業的旅遊導覽 AI")
	if err != nil {
		// 降級：使用模板化回應
		return n.generateFallbackNarration(results, categoryName), nil
	}

	return strings.TrimSpace(response), nil
}

// generateFallbackNarration 降級回應（當 AI 失敗時）
func (n *NearbyNarrator) generateFallbackNarration(
	results *geo.NearbySearchResult,
	categoryName string,
) string {
	if results.Total == 0 {
		return fmt.Sprintf("😅 附近沒有找到%s", categoryName)
	}

	response := fmt.Sprintf("找到 %d 個%s！", results.Total, categoryName)

	// 列舉前 3 個
	top3 := results.Locations
	if len(top3) > 3 {
		top3 = top3[:3]
	}

	for _, loc := range top3 {
		emoji := "📍"
		distance := geo.FormatDistance(loc.Distance)
		response += fmt.Sprintf("\n%s %s (%s)", emoji, loc.Name, distance)
	}

	return response
}
