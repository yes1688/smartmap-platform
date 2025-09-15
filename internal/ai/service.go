package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"intelligent-spatial-platform/internal/geo"
)

type Service struct {
	ollamaURL string
	client    *http.Client
}

type OllamaRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
	Stream bool   `json:"stream"`
}

type OllamaResponse struct {
	Response string `json:"response"`
	Done     bool   `json:"done"`
}

func NewService(ollamaURL string) *Service {
	return &Service{
		ollamaURL: ollamaURL,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (s *Service) Chat(message, context string) (string, error) {
	// 為一般聊天添加台灣用語指示
	baseContext := "你是智慧空間平台的AI助理，請用台灣常見的用語和較親切的語調回答。回答請簡潔有用，不要太冗長。"

	prompt := message
	if context != "" {
		prompt = fmt.Sprintf("%s\n\nContext: %s\n\nUser: %s", baseContext, context, message)
	} else {
		prompt = fmt.Sprintf("%s\n\nUser: %s", baseContext, message)
	}

	model := os.Getenv("OLLAMA_MODEL")
	if model == "" {
		model = "phi4-mini-max:latest"
	}

	request := OllamaRequest{
		Model:  model,
		Prompt: prompt,
		Stream: false,
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %v", err)
	}

	resp, err := s.client.Post(s.ollamaURL+"/api/generate", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to call Ollama API: %v", err)
	}
	defer resp.Body.Close()

	var response OllamaResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return "", fmt.Errorf("failed to decode response: %v", err)
	}

	return response.Response, nil
}

func (s *Service) GenerateHistoricalSiteIntroduction(site *geo.HistoricalSite) (string, error) {
	prompt := fmt.Sprintf(`請為以下歷史景點生成一段簡潔有趣的中文介紹（約100-150字）：

景點名稱：%s
描述：%s
歷史年代：%s
地理位置：緯度 %f，經度 %f

請用生動活潑的語言介紹這個景點的歷史背景、文化意義和有趣的故事。`,
		site.Name, site.Description, site.Era, site.Latitude, site.Longitude)

	return s.Chat(prompt, "你是一位專業的歷史導覽員，擅長用有趣的方式介紹台灣的歷史景點。")
}

func (s *Service) ProcessVoiceCommand(command string, playerLocation *geo.Location) (string, error) {
	prompt := fmt.Sprintf(`用戶的語音指令："%s"
用戶當前位置：緯度 %f，經度 %f

請分析這個語音指令，並提供相應的回應。如果是：
1. 導航指令 - 提供方向指引
2. 景點查詢 - 介紹附近的歷史景點
3. 遊戲指令 - 提供遊戲相關的回應
4. 其他對話 - 進行友善的對話

請用繁體中文回應，保持友善和有幫助的語調。`,
		command, playerLocation.Latitude, playerLocation.Longitude)

	return s.Chat(prompt, "你是智慧空間平台的AI助理，專門幫助使用者進行地圖導覽、歷史景點探索和互動遊戲。請用台灣用語回答，語調親切友善。")
}

func (s *Service) GenerateGameResponse(action, result string) (string, error) {
	prompt := fmt.Sprintf(`遊戲動作：%s
動作結果：%s

請為這個遊戲動作生成一個有趣的中文回應（約30-50字），增加遊戲的趣味性。`, action, result)

	return s.Chat(prompt, "你是遊戲主持人，負責為空間探索遊戲提供有趣的互動回應。請用台灣用語，語調要活潑有趣。")
}

func (s *Service) ProcessMovementCommand(command, playerID string, currentLocation *geo.Location) (string, error) {
	// Create movement parser
	parser := NewMovementCommandParser(s)

	// Parse the movement command
	moveCmd, err := parser.ParseMovementCommand(command, currentLocation)
	if err != nil {
		// If not a movement command, return regular chat response
		return s.ProcessVoiceCommand(command, currentLocation)
	}

	// Generate AI response for movement
	prompt := fmt.Sprintf(`玩家發出移動指令："%s"
解析結果：
- 類型：%s
- 動作：%s
- 目標位置：緯度 %.6f，經度 %.6f
- 預估時間：%d 秒
- 信心度：%.1f%%

請生成一個友善的回應，告知玩家移動指令已理解並將執行。用台灣用語，語調親切。`,
		moveCmd.OriginalText,
		moveCmd.Type,
		moveCmd.Action,
		moveCmd.Destination.Latitude,
		moveCmd.Destination.Longitude,
		moveCmd.EstimatedTime,
		moveCmd.Confidence*100)

	return s.Chat(prompt, "你是智慧空間平台的AI助理，專門幫助使用者控制虛擬兔子移動。請用台灣用語，語調親切友善。")
}