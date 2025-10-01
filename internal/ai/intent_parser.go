package ai

import (
	"encoding/json"
	"fmt"
	"strings"

	"intelligent-spatial-platform/internal/geo"
)

// IntentType 意圖類型
type IntentType string

const (
	IntentSearch   IntentType = "search"    // 搜尋附近的地點
	IntentMove     IntentType = "move"      // 移動到某地
	IntentDescribe IntentType = "describe"  // 描述/介紹
	IntentRecommend IntentType = "recommend" // 推薦
)

// CategoryType 地點類別
type CategoryType string

const (
	CategoryRestaurant CategoryType = "restaurant" // 餐廳
	CategoryCafe       CategoryType = "cafe"       // 咖啡廳
	CategoryAttraction CategoryType = "attraction" // 景點
	CategoryHotel      CategoryType = "hotel"      // 飯店
	CategoryPark       CategoryType = "park"       // 公園
	CategoryMuseum     CategoryType = "museum"     // 博物館
	CategoryGeneral    CategoryType = "general"    // 一般（全部）
)

// VoiceIntent 語音意圖解析結果
type VoiceIntent struct {
	Type       IntentType   `json:"type"`
	Category   CategoryType `json:"category"`
	Keywords   []string     `json:"keywords"`
	Radius     float64      `json:"radius"`      // 搜尋半徑（米）
	TargetName string       `json:"targetName"`  // 移動目標名稱
	Confidence float64      `json:"confidence"`  // 信心度 0-1
}

// IntentParser 意圖解析器
type IntentParser struct {
	ai               *Service
	geocodingService *geo.GeocodingService
}

func NewIntentParser(ai *Service, geocodingService *geo.GeocodingService) *IntentParser {
	return &IntentParser{
		ai:               ai,
		geocodingService: geocodingService,
	}
}

// ParseVoiceCommand 解析語音指令
func (p *IntentParser) ParseVoiceCommand(command string, currentLocation *geo.Location) (*VoiceIntent, error) {
	return p.ParseVoiceCommandWithUser("", command, currentLocation)
}

// ParseVoiceCommandWithUser 解析語音指令（支援按用戶速率限制）
func (p *IntentParser) ParseVoiceCommandWithUser(userID, command string, currentLocation *geo.Location) (*VoiceIntent, error) {
	// 構建 AI Prompt
	prompt := fmt.Sprintf(`你是語音指令解析專家。請分析以下台灣用戶的語音指令：

語音指令："%s"
當前位置：緯度 %.6f，經度 %.6f

請判斷用戶的意圖並以 JSON 格式回答：

【核心規則 - 非常重要】
1. 預設所有指令都是 "move"（移動到某地）
2. 只有明確說「附近」「周邊」「哪裡有」「有什麼」→ 才是 "search"
3. targetName 填入用戶想找的地點名稱或關鍵字

意圖類型：
- "move": 移動到某地（預設選項）
  範例：「去台北101」「想吃劉家湯圓」「星巴克」「嘉義市」
  → 將用戶說的內容提取為 targetName

- "search": 僅當用戶明確要求列表時
  範例：「附近有什麼餐廳」「周邊哪裡有咖啡廳」「找景點」
  → 將類型關鍵字放入 keywords

- "describe": 描述當前地點
  關鍵詞：介紹、這是哪、什麼地方

- "recommend": 請求推薦
  關鍵詞：推薦、建議

地點類別：
- "restaurant": 餐廳、美食、吃的、飯店（用餐）
- "cafe": 咖啡廳、飲料店、茶飲
- "attraction": 景點、觀光、旅遊、古蹟
- "hotel": 飯店（住宿）、旅館
- "park": 公園、綠地
- "museum": 博物館、展覽館
- "general": 一般（沒有特定類別）

回傳格式：
{
  "type": "search|move|describe|recommend",
  "category": "restaurant|cafe|attraction|hotel|park|museum|general",
  "keywords": ["關鍵詞1", "關鍵詞2"],
  "radius": 500,
  "targetName": "目標地點名稱（僅 move 意圖需要）",
  "confidence": 0.0-1.0
}

範例：

【移動指令範例 - 預設行為】
輸入："我要去台北101"
輸出：{"type":"move","category":"attraction","keywords":[],"radius":0,"targetName":"台北101","confidence":0.98}

輸入："想吃劉家湯圓"
輸出：{"type":"move","category":"restaurant","keywords":[],"radius":0,"targetName":"劉家湯圓","confidence":0.96}

輸入："星巴克"
輸出：{"type":"move","category":"cafe","keywords":[],"radius":0,"targetName":"星巴克","confidence":0.95}

輸入："嘉義市"
輸出：{"type":"move","category":"general","keywords":[],"radius":0,"targetName":"嘉義市","confidence":0.97}

輸入："想吃火鍋"
輸出：{"type":"move","category":"restaurant","keywords":[],"radius":0,"targetName":"火鍋","confidence":0.90}

【搜尋列表範例 - 僅當明確說「附近」等詞】
輸入："附近有什麼好吃的"
輸出：{"type":"search","category":"restaurant","keywords":["餐廳"],"radius":500,"targetName":"","confidence":0.95}

輸入："附近有什麼景點"
輸出：{"type":"search","category":"attraction","keywords":["景點"],"radius":500,"targetName":"","confidence":0.92}

輸入："哪裡有咖啡廳"
輸出：{"type":"search","category":"cafe","keywords":["咖啡廳"],"radius":500,"targetName":"","confidence":0.90}

請只回傳 JSON，不要有其他說明文字。`,
		command,
		currentLocation.Latitude,
		currentLocation.Longitude,
	)

	// 呼叫 AI（支援按用戶速率限制）
	response, err := p.ai.ChatWithUser(userID, prompt, "你是專業的語音指令解析系統")
	if err != nil {
		return nil, fmt.Errorf("AI 解析失敗: %v", err)
	}

	// 清理 AI 回應（移除可能的 markdown 標記）
	response = strings.TrimSpace(response)
	response = strings.TrimPrefix(response, "```json")
	response = strings.TrimPrefix(response, "```")
	response = strings.TrimSuffix(response, "```")
	response = strings.TrimSpace(response)

	// 解析 JSON
	var intent VoiceIntent
	if err := json.Unmarshal([]byte(response), &intent); err != nil {
		return nil, fmt.Errorf("解析 JSON 失敗: %v, 原始回應: %s", err, response)
	}

	// 信心度檢查
	if intent.Confidence < 0.7 {
		return nil, fmt.Errorf("信心度過低 (%.2f)", intent.Confidence)
	}

	return &intent, nil
}

// CategoryToChineseName 類別轉中文名稱
func CategoryToChineseName(category CategoryType) string {
	names := map[CategoryType]string{
		CategoryRestaurant: "餐廳",
		CategoryCafe:       "咖啡廳",
		CategoryAttraction: "景點",
		CategoryHotel:      "飯店",
		CategoryPark:       "公園",
		CategoryMuseum:     "博物館",
		CategoryGeneral:    "地點",
	}
	if name, ok := names[category]; ok {
		return name
	}
	return "地點"
}
