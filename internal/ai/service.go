package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"intelligent-spatial-platform/internal/geo"
)

// AI Provider types
type ProviderType string

const (
	ProviderOllama     ProviderType = "ollama"
	ProviderOpenRouter ProviderType = "openrouter"
)

type Service struct {
	provider         ProviderType
	geocodingService *geo.GeocodingService
	client           *http.Client
	rateLimiter      *AIRateLimiter

	// Ollama specific
	ollamaURL   string
	ollamaModel string

	// OpenRouter specific
	openRouterURL    string
	openRouterAPIKey string
	openRouterModel  string
}

// Request/Response structures for Ollama
type OllamaRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
	Stream bool   `json:"stream"`
}

type OllamaResponse struct {
	Response string `json:"response"`
	Done     bool   `json:"done"`
}

// Request/Response structures for OpenRouter
type OpenRouterRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Stream   bool      `json:"stream"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenRouterResponse struct {
	Choices []Choice `json:"choices"`
	Error   *APIError `json:"error,omitempty"`
}

type Choice struct {
	Message Message `json:"message"`
}

type APIError struct {
	Message string `json:"message"`
	Type    string `json:"type"`
}

// Rate limiter for AI requests
type AIRateLimiter struct {
	lastRequest time.Time
	mu          sync.Mutex
	minInterval time.Duration
}

func NewAIRateLimiter(rpm int) *AIRateLimiter {
	minInterval := time.Minute / time.Duration(rpm)
	return &AIRateLimiter{
		minInterval: minInterval,
	}
}

func (r *AIRateLimiter) Allow() (bool, time.Duration) {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	timeSinceLastRequest := now.Sub(r.lastRequest)

	if timeSinceLastRequest >= r.minInterval {
		r.lastRequest = now
		return true, 0
	}

	waitTime := r.minInterval - timeSinceLastRequest
	return false, waitTime
}

func NewService() *Service {
	// Initialize geocoding service
	geocodingService, err := geo.NewGeocodingService()
	if err != nil {
		// Log error but don't fail service initialization
		fmt.Printf("Warning: Failed to initialize geocoding service: %v\n", err)
	}

	// Determine AI provider from environment
	providerStr := strings.ToLower(os.Getenv("AI_PROVIDER"))
	var provider ProviderType
	switch providerStr {
	case "openrouter":
		provider = ProviderOpenRouter
	case "ollama", "":
		provider = ProviderOllama
	default:
		fmt.Printf("Warning: Unknown AI provider '%s', defaulting to ollama\n", providerStr)
		provider = ProviderOllama
	}

	// Initialize rate limiter
	rpm := 60 // Default to 60 requests per minute for Ollama
	if provider == ProviderOpenRouter {
		rpm = 1 // OpenRouter free tier limit
	}
	rateLimiter := NewAIRateLimiter(rpm)

	service := &Service{
		provider:         provider,
		geocodingService: geocodingService,
		rateLimiter:      rateLimiter,
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}

	// Configure provider-specific settings
	switch provider {
	case ProviderOllama:
		service.ollamaURL = os.Getenv("OLLAMA_URL")
		if service.ollamaURL == "" {
			service.ollamaURL = "http://localhost:11434"
		}
		service.ollamaModel = os.Getenv("OLLAMA_MODEL")
		if service.ollamaModel == "" {
			service.ollamaModel = "phi4-mini-max:latest"
		}
		fmt.Printf("AI Service initialized with Ollama: %s (model: %s)\n", service.ollamaURL, service.ollamaModel)

	case ProviderOpenRouter:
		service.openRouterURL = os.Getenv("OPENROUTER_URL")
		if service.openRouterURL == "" {
			service.openRouterURL = "https://openrouter.ai/api/v1/chat/completions"
		}
		service.openRouterAPIKey = os.Getenv("OPENROUTER_API_KEY")
		service.openRouterModel = os.Getenv("OPENROUTER_MODEL")
		if service.openRouterModel == "" {
			service.openRouterModel = "google/gemma-2-27b-it:free"
		}
		if service.openRouterAPIKey == "" {
			fmt.Printf("Warning: OPENROUTER_API_KEY not set\n")
		}
		fmt.Printf("AI Service initialized with OpenRouter: %s (model: %s)\n", service.openRouterModel, service.openRouterURL)
	}

	return service
}

func (s *Service) Chat(message, context string) (string, error) {
	// Check rate limit
	if allowed, waitTime := s.rateLimiter.Allow(); !allowed {
		return "", fmt.Errorf("rate limit exceeded, please wait %v before making another request", waitTime)
	}

	// Build the final prompt/message
	baseContext := "你是智慧空間平台的AI助理，請用台灣常見的用語和較親切的語調回答。回答請簡潔有用，不要太冗長。"

	var fullMessage string
	if context != "" {
		fullMessage = fmt.Sprintf("%s\n\nContext: %s\n\nUser: %s", baseContext, context, message)
	} else {
		fullMessage = fmt.Sprintf("%s\n\nUser: %s", baseContext, message)
	}

	// Route to appropriate provider
	switch s.provider {
	case ProviderOllama:
		return s.chatWithOllama(fullMessage)
	case ProviderOpenRouter:
		return s.chatWithOpenRouter(fullMessage)
	default:
		return "", fmt.Errorf("unsupported AI provider: %s", s.provider)
	}
}

func (s *Service) chatWithOllama(prompt string) (string, error) {
	request := OllamaRequest{
		Model:  s.ollamaModel,
		Prompt: prompt,
		Stream: false,
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return "", fmt.Errorf("failed to marshal Ollama request: %v", err)
	}

	resp, err := s.client.Post(s.ollamaURL+"/api/generate", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to call Ollama API: %v", err)
	}
	defer resp.Body.Close()

	var response OllamaResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return "", fmt.Errorf("failed to decode Ollama response: %v", err)
	}

	return response.Response, nil
}

func (s *Service) chatWithOpenRouter(prompt string) (string, error) {
	request := OpenRouterRequest{
		Model: s.openRouterModel,
		Messages: []Message{
			{
				Role:    "user",
				Content: prompt,
			},
		},
		Stream: false,
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return "", fmt.Errorf("failed to marshal OpenRouter request: %v", err)
	}

	req, err := http.NewRequest("POST", s.openRouterURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create OpenRouter request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.openRouterAPIKey)
	req.Header.Set("HTTP-Referer", "https://smartmap-platform.local")
	req.Header.Set("X-Title", "Smart Map Platform")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to call OpenRouter API: %v", err)
	}
	defer resp.Body.Close()

	var response OpenRouterResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return "", fmt.Errorf("failed to decode OpenRouter response: %v", err)
	}

	if response.Error != nil {
		return "", fmt.Errorf("OpenRouter API error: %s (%s)", response.Error.Message, response.Error.Type)
	}

	if len(response.Choices) == 0 {
		return "", fmt.Errorf("no response from OpenRouter API")
	}

	return response.Choices[0].Message.Content, nil
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
	// Create movement parser with geocoding service
	parser := NewMovementCommandParser(s, s.geocodingService)

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