package main

import (
	"fmt"
	"strings"
)

// 簡化的測試函數
func isMovementCommand(text string) bool {
	movementKeywords := []string{
		"移動", "去", "前往", "到", "走", "跑", "移動到", "帶我去", "導航到",
		"move", "go", "walk", "run", "navigate", "travel", "head",
	}

	lowerText := strings.ToLower(text)
	for _, keyword := range movementKeywords {
		if strings.Contains(lowerText, strings.ToLower(keyword)) {
			return true
		}
	}
	return false
}

func containsLocationName(text string) bool {
	locationIndicators := []string{
		"台北", "高雄", "台中", "台南", "桃園", "新竹", "基隆", "嘉義", "彰化", "南投", "雲林", "屏東", "宜蘭", "花蓮", "台東", "澎湖", "金門", "馬祖",
		"中正紀念堂", "台北101", "故宮", "夜市", "火車站", "機場", "總統府", "自由廣場", "龍山寺", "西門町", "九份", "淡水", "北投", "陽明山",
		"日月潭", "阿里山", "太魯閣", "墾丁", "清境", "合歡山", "玉山", "溪頭", "杉林溪", "集集", "鹿港", "安平", "赤崁樓", "愛河", "旗津",
		"佛光山", "義大世界", "六合夜市", "逢甲夜市", "一中商圈", "東海大學", "中興大學", "成功大學", "中山大學", "高雄大學",
		"大學", "學院", "科技大學", "技術學院", "師範大學", "醫學院", "university", "college",
	}

	lowerText := strings.ToLower(text)
	for _, indicator := range locationIndicators {
		if strings.Contains(lowerText, strings.ToLower(indicator)) {
			return true
		}
	}

	// 額外檢查：如果包含「到」、「去」等移動關鍵詞，也可能是地點移動
	movementWithLocation := []string{
		"到", "去", "前往", "移動到", "帶我去", "導航到", "走到", "跑到", "飛到",
		"go to", "move to", "navigate to", "travel to", "head to",
	}

	for _, keyword := range movementWithLocation {
		if strings.Contains(lowerText, strings.ToLower(keyword)) {
			return true
		}
	}

	return false
}

func main() {
	testCommands := []string{
		"移動兔子到台大",
		"移動兔子到墾丁",
		"去台北101",
		"帶我去高雄",
		"你好",
	}

	for _, cmd := range testCommands {
		fmt.Printf("測試指令: '%s'\n", cmd)
		fmt.Printf("  是移動指令: %v\n", isMovementCommand(cmd))
		fmt.Printf("  包含地點名稱: %v\n", containsLocationName(cmd))
		fmt.Println()
	}
}