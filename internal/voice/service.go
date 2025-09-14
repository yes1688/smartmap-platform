package voice

import (
	"encoding/base64"
	"fmt"
	"strings"
)

type Service struct {
}

type VoiceCommand struct {
	Type       string                 `json:"type"`       // navigation, query, game, chat
	Action     string                 `json:"action"`     // move, collect, ask, etc.
	Parameters map[string]interface{} `json:"parameters"` // additional command parameters
	Text       string                 `json:"text"`       // original text
}

func NewService() *Service {
	return &Service{}
}

func (s *Service) ProcessAudio(audioData, language string) (string, error) {
	audioBytes, err := base64.StdEncoding.DecodeString(audioData)
	if err != nil {
		return "", fmt.Errorf("failed to decode audio data: %v", err)
	}

	text, err := s.speechToText(audioBytes, language)
	if err != nil {
		return "", fmt.Errorf("failed to convert speech to text: %v", err)
	}

	return text, nil
}

func (s *Service) speechToText(audioData []byte, language string) (string, error) {
	return "語音識別功能需要整合實際的語音識別服務", nil
}

func (s *Service) ParseVoiceCommand(text string) (*VoiceCommand, error) {
	text = strings.ToLower(strings.TrimSpace(text))

	command := &VoiceCommand{
		Text:       text,
		Parameters: make(map[string]interface{}),
	}

	if s.isNavigationCommand(text) {
		command.Type = "navigation"
		command.Action = s.extractNavigationAction(text)
		command.Parameters = s.extractNavigationParameters(text)
	} else if s.isGameCommand(text) {
		command.Type = "game"
		command.Action = s.extractGameAction(text)
		command.Parameters = s.extractGameParameters(text)
	} else if s.isQueryCommand(text) {
		command.Type = "query"
		command.Action = "ask"
		command.Parameters["question"] = text
	} else {
		command.Type = "chat"
		command.Action = "talk"
		command.Parameters["message"] = text
	}

	return command, nil
}

func (s *Service) isNavigationCommand(text string) bool {
	navigationKeywords := []string{
		"導航", "前往", "去", "帶我去", "路線", "方向",
		"navigate", "go to", "direction", "route",
	}

	for _, keyword := range navigationKeywords {
		if strings.Contains(text, keyword) {
			return true
		}
	}
	return false
}

func (s *Service) isGameCommand(text string) bool {
	gameKeywords := []string{
		"收集", "撿起", "遊戲", "分數", "道具", "寶物",
		"collect", "pick up", "game", "score", "item", "treasure",
	}

	for _, keyword := range gameKeywords {
		if strings.Contains(text, keyword) {
			return true
		}
	}
	return false
}

func (s *Service) isQueryCommand(text string) bool {
	queryKeywords := []string{
		"什麼", "哪裡", "怎麼", "為什麼", "介紹", "告訴我",
		"what", "where", "how", "why", "tell me", "explain",
	}

	for _, keyword := range queryKeywords {
		if strings.Contains(text, keyword) {
			return true
		}
	}
	return false
}

func (s *Service) extractNavigationAction(text string) string {
	if strings.Contains(text, "導航") || strings.Contains(text, "navigate") {
		return "navigate"
	} else if strings.Contains(text, "路線") || strings.Contains(text, "route") {
		return "route"
	} else if strings.Contains(text, "方向") || strings.Contains(text, "direction") {
		return "direction"
	}
	return "navigate"
}

func (s *Service) extractNavigationParameters(text string) map[string]interface{} {
	params := make(map[string]interface{})

	params["destination"] = s.extractDestination(text)

	return params
}

func (s *Service) extractDestination(text string) string {
	patterns := []string{"前往", "去", "帶我去", "go to", "navigate to"}

	for _, pattern := range patterns {
		if idx := strings.Index(text, pattern); idx != -1 {
			return strings.TrimSpace(text[idx+len(pattern):])
		}
	}

	return ""
}

func (s *Service) extractGameAction(text string) string {
	if strings.Contains(text, "收集") || strings.Contains(text, "collect") {
		return "collect"
	} else if strings.Contains(text, "撿起") || strings.Contains(text, "pick") {
		return "pickup"
	} else if strings.Contains(text, "分數") || strings.Contains(text, "score") {
		return "score"
	}
	return "status"
}

func (s *Service) extractGameParameters(text string) map[string]interface{} {
	params := make(map[string]interface{})

	if strings.Contains(text, "附近") || strings.Contains(text, "nearby") {
		params["nearby"] = true
	}

	return params
}

func (s *Service) TextToSpeech(text, language string) ([]byte, error) {
	return []byte{}, fmt.Errorf("text-to-speech not implemented yet")
}