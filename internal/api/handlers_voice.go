package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ProcessVoice processes voice audio input
func (h *Handler) ProcessVoice(c *gin.Context) {
	var request struct {
		AudioData string `json:"audioData"`
		Language  string `json:"language"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	text, err := h.voice.ProcessAudio(request.AudioData, request.Language)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"text": text})
}