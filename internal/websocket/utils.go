package websocket

import (
	"fmt"
	"time"
)

func getCurrentTimestamp() int64 {
	return time.Now().UnixMilli()
}

func generateClientID() string {
	return fmt.Sprintf("client_%d", time.Now().UnixNano())
}