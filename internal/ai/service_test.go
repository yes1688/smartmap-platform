package ai

import (
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"
)

// TestProviderType tests provider type constants
func TestProviderType(t *testing.T) {
	tests := []struct {
		name     string
		provider ProviderType
		expected string
	}{
		{"Ollama provider", ProviderOllama, "ollama"},
		{"OpenRouter provider", ProviderOpenRouter, "openrouter"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.provider) != tt.expected {
				t.Errorf("Expected %s, got %s", tt.expected, string(tt.provider))
			}
		})
	}
}

// TestNewService tests service initialization
func TestNewService(t *testing.T) {
	// 暫存原始環境變數
	originalProvider := getEnv("AI_PROVIDER", "ollama")

	// 測試 Ollama provider
	t.Setenv("AI_PROVIDER", "ollama")
	t.Setenv("OLLAMA_URL", "http://localhost:11434")
	t.Setenv("OLLAMA_MODEL", "test-model")

	service := NewService()

	if service == nil {
		t.Fatal("Service should not be nil")
	}

	if service.provider != ProviderOllama {
		t.Errorf("Expected provider %s, got %s", ProviderOllama, service.provider)
	}

	if service.ollamaURL != "http://localhost:11434" {
		t.Errorf("Expected URL http://localhost:11434, got %s", service.ollamaURL)
	}

	// 測試 OpenRouter provider
	t.Setenv("AI_PROVIDER", "openrouter")
	t.Setenv("OPENROUTER_URL", "https://openrouter.ai/api/v1/chat/completions")
	t.Setenv("OPENROUTER_API_KEY", "test-key")
	t.Setenv("OPENROUTER_MODEL", "test-model")

	service2 := NewService()

	if service2.provider != ProviderOpenRouter {
		t.Errorf("Expected provider %s, got %s", ProviderOpenRouter, service2.provider)
	}

	// 恢復環境變數
	t.Setenv("AI_PROVIDER", originalProvider)
}

// TestRateLimiter tests rate limiting functionality
func TestRateLimiter(t *testing.T) {
	// 測試 2 RPM 的限制器
	limiter := NewAIRateLimiter(2)

	// 第一次請求應該成功
	allowed, _ := limiter.Allow()
	if !allowed {
		t.Error("First request should be allowed")
	}

	// 立即第二次請求應該被限制（因為還沒到 30 秒）
	allowed, waitTime := limiter.Allow()
	if allowed {
		t.Error("Second immediate request should be rate limited")
	}

	if waitTime == 0 {
		t.Error("Wait time should be greater than 0")
	}

	// 測試高頻率限制器 (60 RPM)
	fastLimiter := NewAIRateLimiter(60)
	allowed, _ = fastLimiter.Allow()
	if !allowed {
		t.Error("Fast limiter first request should be allowed")
	}
}

// TestChatWithMockServer tests Chat function with mock server
func TestChatWithOllamaMockServer(t *testing.T) {
	// 建立 mock Ollama server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("Expected POST request, got %s", r.Method)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"response": "Test response", "done": true}`))
	}))
	defer server.Close()

	// 建立測試 service
	service := &Service{
		provider:    ProviderOllama,
		ollamaURL:   server.URL,
		ollamaModel: "test-model",
		client:      &http.Client{},
		rateLimiter: NewAIRateLimiter(60),
	}

	response, err := service.Chat("test message", "test context")

	if err != nil {
		t.Fatalf("Chat should not return error: %v", err)
	}

	if response != "Test response" {
		t.Errorf("Expected 'Test response', got %s", response)
	}
}

// TestChatWithOpenRouterMockServer tests OpenRouter integration
func TestChatWithOpenRouterMockServer(t *testing.T) {
	// 建立 mock OpenRouter server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 檢查 Authorization header
		auth := r.Header.Get("Authorization")
		if auth != "Bearer test-key" {
			t.Errorf("Expected Authorization header 'Bearer test-key', got %s", auth)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{
			"choices": [{
				"message": {
					"role": "assistant",
					"content": "OpenRouter test response"
				}
			}]
		}`))
	}))
	defer server.Close()

	service := &Service{
		provider:         ProviderOpenRouter,
		openRouterURL:    server.URL,
		openRouterAPIKey: "test-key",
		openRouterModel:  "test-model",
		client:           &http.Client{},
		rateLimiter:      NewAIRateLimiter(60),
	}

	response, err := service.Chat("test message", "test context")

	if err != nil {
		t.Fatalf("Chat should not return error: %v", err)
	}

	if response != "OpenRouter test response" {
		t.Errorf("Expected 'OpenRouter test response', got %s", response)
	}
}

// TestRateLimitError tests rate limit error handling
func TestRateLimitError(t *testing.T) {
	limiter := NewAIRateLimiter(1) // 1 request per minute

	// 手動設定 lastRequest 為現在，模擬剛發送過請求
	limiter.lastRequest = time.Now()

	service := &Service{
		provider:    ProviderOllama,
		rateLimiter: limiter,
	}

	// 立即第二次請求應該被限制
	_, err := service.Chat("test", "test")

	if err == nil {
		t.Error("Should return rate limit error")
	}

	if !strings.Contains(err.Error(), "rate limit exceeded") {
		t.Errorf("Error should mention rate limit, got: %v", err)
	}
}

// Benchmark tests
func BenchmarkRateLimiterAllow(b *testing.B) {
	limiter := NewAIRateLimiter(60)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		limiter.Allow()
	}
}

// Helper function for environment variables
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}