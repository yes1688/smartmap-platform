package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
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
	prompt := message
	if context != "" {
		prompt = fmt.Sprintf("Context: %s\n\nUser: %s", context, message)
	}

	request := OllamaRequest{
		Model:  "llama2:7b",
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

	return s.Chat(prompt, "你是一位智慧空間平台的AI助手，專門協助用戶進行地圖導航、歷史景點探索和互動遊戲。")
}

func (s *Service) GenerateGameResponse(action, result string) (string, error) {
	prompt := fmt.Sprintf(`遊戲動作：%s
動作結果：%s

請為這個遊戲動作生成一個有趣的中文回應（約30-50字），增加遊戲的趣味性。`, action, result)

	return s.Chat(prompt, "你是一位遊戲主持人，負責為空間探索遊戲提供有趣的互動回應。")
}