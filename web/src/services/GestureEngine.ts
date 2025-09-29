export enum GestureType {
  DoubleTap = 'double_tap',
  LongPress = 'long_press',
  TwoFingerTap = 'two_finger_tap',
  ThreeFingerTap = 'three_finger_tap',
  SwipeUp = 'swipe_up',
  SwipeDown = 'swipe_down',
  SwipeLeft = 'swipe_left',
  SwipeRight = 'swipe_right',
  Pinch = 'pinch',
  Spread = 'spread',
  CircularSwipe = 'circular_swipe'
}

export interface GestureEvent {
  type: GestureType;
  position: { x: number; y: number };
  data?: any;
  timestamp: number;
}

export interface GestureAction {
  gesture: GestureType;
  action: (event: GestureEvent) => void;
  description: string;
  enabled: boolean;
}

export class GestureEngine {
  private gestures: Map<GestureType, GestureAction> = new Map();
  private element: HTMLElement;
  private touchStartTime: number = 0;
  private touchStartPosition: { x: number; y: number } = { x: 0, y: 0 };
  private lastTapTime: number = 0;
  private tapCount: number = 0;
  private activeTouches: TouchList | null = null;
  private isLongPressing: boolean = false;
  private longPressTimer: number | null = null;

  // 配置參數
  private readonly DOUBLE_TAP_THRESHOLD = 300; // ms
  private readonly LONG_PRESS_THRESHOLD = 800; // ms
  private readonly SWIPE_THRESHOLD = 50; // px
  private readonly PINCH_THRESHOLD = 20; // px

  constructor(element: HTMLElement) {
    this.element = element;
    this.initializeDefaultGestures();
    this.setupEventListeners();
  }

  // 初始化默認手勢
  private initializeDefaultGestures(): void {
    this.registerGesture({
      gesture: GestureType.DoubleTap,
      action: (event) => this.handleDoubleTap(event),
      description: '雙擊快速移動到點擊位置',
      enabled: true
    });

    this.registerGesture({
      gesture: GestureType.LongPress,
      action: (event) => this.handleLongPress(event),
      description: '長按顯示位置詳情',
      enabled: true
    });

    this.registerGesture({
      gesture: GestureType.TwoFingerTap,
      action: (event) => this.handleTwoFingerTap(event),
      description: '雙指點擊調整地圖視角',
      enabled: true
    });

    this.registerGesture({
      gesture: GestureType.ThreeFingerTap,
      action: (event) => this.handleThreeFingerTap(event),
      description: '三指點擊呼出AI助手',
      enabled: true
    });

    this.registerGesture({
      gesture: GestureType.SwipeUp,
      action: (event) => this.handleSwipeUp(event),
      description: '向上滑動顯示附近景點',
      enabled: true
    });

    this.registerGesture({
      gesture: GestureType.SwipeDown,
      action: (event) => this.handleSwipeDown(event),
      description: '向下滑動隱藏界面元素',
      enabled: true
    });

    this.registerGesture({
      gesture: GestureType.CircularSwipe,
      action: (event) => this.handleCircularSwipe(event),
      description: '圓形手勢重置地圖視角',
      enabled: true
    });
  }

  // 註冊手勢
  registerGesture(gestureAction: GestureAction): void {
    this.gestures.set(gestureAction.gesture, gestureAction);
  }

  // 移除手勢
  unregisterGesture(gesture: GestureType): void {
    this.gestures.delete(gesture);
  }

  // 啟用/禁用手勢
  setGestureEnabled(gesture: GestureType, enabled: boolean): void {
    const gestureAction = this.gestures.get(gesture);
    if (gestureAction) {
      gestureAction.enabled = enabled;
    }
  }

  // 設置事件監聽器
  private setupEventListeners(): void {
    // 觸控事件
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

    // 滑鼠事件（桌面支援）
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // 鍵盤手勢
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  // 觸控開始
  private handleTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    this.touchStartTime = Date.now();
    this.touchStartPosition = { x: touch.clientX, y: touch.clientY };
    this.activeTouches = event.touches;

    // 設置長按計時器
    this.longPressTimer = window.setTimeout(() => {
      if (!this.isLongPressing) {
        this.isLongPressing = true;
        this.triggerGesture(GestureType.LongPress, this.touchStartPosition);
      }
    }, this.LONG_PRESS_THRESHOLD);

    // 檢測多指觸控
    if (event.touches.length === 2) {
      this.clearLongPressTimer();
    } else if (event.touches.length === 3) {
      this.clearLongPressTimer();
      this.triggerGesture(GestureType.ThreeFingerTap, this.touchStartPosition);
      event.preventDefault();
    }
  }

  // 觸控移動
  private handleTouchMove(event: TouchEvent): void {
    if (this.longPressTimer) {
      const touch = event.touches[0];
      const deltaX = Math.abs(touch.clientX - this.touchStartPosition.x);
      const deltaY = Math.abs(touch.clientY - this.touchStartPosition.y);

      // 如果移動超過閾值，取消長按
      if (deltaX > 10 || deltaY > 10) {
        this.clearLongPressTimer();
      }
    }

    // 檢測捏合手勢
    if (event.touches.length === 2) {
      this.handlePinchGesture(event);
    }
  }

  // 觸控結束
  private handleTouchEnd(event: TouchEvent): void {
    const currentTime = Date.now();
    const touchDuration = currentTime - this.touchStartTime;

    this.clearLongPressTimer();
    this.isLongPressing = false;

    if (event.changedTouches.length === 1 && !this.isLongPressing) {
      const touch = event.changedTouches[0];
      const endPosition = { x: touch.clientX, y: touch.clientY };

      // 檢測滑動手勢
      if (touchDuration < 500) {
        this.detectSwipeGesture(this.touchStartPosition, endPosition);
      }

      // 檢測點擊手勢
      if (touchDuration < 200) {
        this.handleTapGesture(endPosition, currentTime);
      }
    } else if (event.changedTouches.length === 2) {
      // 雙指點擊
      this.triggerGesture(GestureType.TwoFingerTap, this.touchStartPosition);
    }
  }

  // 處理點擊手勢
  private handleTapGesture(position: { x: number; y: number }, currentTime: number): void {
    const timeSinceLastTap = currentTime - this.lastTapTime;

    if (timeSinceLastTap < this.DOUBLE_TAP_THRESHOLD) {
      this.tapCount++;
      if (this.tapCount === 2) {
        this.triggerGesture(GestureType.DoubleTap, position);
        this.tapCount = 0;
      }
    } else {
      this.tapCount = 1;
    }

    this.lastTapTime = currentTime;
  }

  // 檢測滑動手勢
  private detectSwipeGesture(startPos: { x: number; y: number }, endPos: { x: number; y: number }): void {
    const deltaX = endPos.x - startPos.x;
    const deltaY = endPos.y - startPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < this.SWIPE_THRESHOLD) return;

    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    let gestureType: GestureType;
    if (angle >= -45 && angle <= 45) {
      gestureType = GestureType.SwipeRight;
    } else if (angle >= 45 && angle <= 135) {
      gestureType = GestureType.SwipeDown;
    } else if (angle >= -135 && angle <= -45) {
      gestureType = GestureType.SwipeUp;
    } else {
      gestureType = GestureType.SwipeLeft;
    }

    this.triggerGesture(gestureType, startPos, { deltaX, deltaY, distance });
  }

  // 處理捏合手勢
  private handlePinchGesture(event: TouchEvent): void {
    if (event.touches.length !== 2) return;

    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    // 這裡可以實現捏合縮放邏輯
    // 暫時省略具體實現
  }

  // 滑鼠事件處理（桌面支援）
  private handleMouseDown(event: MouseEvent): void {
    this.touchStartTime = Date.now();
    this.touchStartPosition = { x: event.clientX, y: event.clientY };

    // 右鍵點擊作為長按
    if (event.button === 2) {
      event.preventDefault();
      this.triggerGesture(GestureType.LongPress, this.touchStartPosition);
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    // 桌面滑鼠移動邏輯
  }

  private handleMouseUp(event: MouseEvent): void {
    const currentTime = Date.now();
    const touchDuration = currentTime - this.touchStartTime;
    const endPosition = { x: event.clientX, y: event.clientY };

    if (event.button === 0 && touchDuration < 200) {
      this.handleTapGesture(endPosition, currentTime);
    }
  }

  // 鍵盤手勢
  private handleKeyDown(event: KeyboardEvent): void {
    // 組合鍵手勢
    if (event.ctrlKey && event.key === 'k') {
      event.preventDefault();
      this.triggerGesture(GestureType.SwipeUp, { x: 0, y: 0 });
    }

    if (event.key === 'Escape') {
      this.triggerGesture(GestureType.SwipeDown, { x: 0, y: 0 });
    }
  }

  // 觸發手勢
  private triggerGesture(type: GestureType, position: { x: number; y: number }, data?: any): void {
    const gestureAction = this.gestures.get(type);

    if (gestureAction && gestureAction.enabled) {
      const gestureEvent: GestureEvent = {
        type,
        position,
        data,
        timestamp: Date.now()
      };

      try {
        gestureAction.action(gestureEvent);
        console.debug(`手勢觸發: ${type}`, gestureEvent);
      } catch (error) {
        console.error(`手勢處理錯誤 ${type}:`, error);
      }
    }
  }

  // 清除長按計時器
  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  // 默認手勢處理器
  private handleDoubleTap(event: GestureEvent): void {
    console.log('🖱️ 雙擊移動:', event.position);
    // 觸發快速移動到點擊位置
    window.dispatchEvent(new CustomEvent('gesture:quickMove', {
      detail: { position: event.position }
    }));
  }

  private handleLongPress(event: GestureEvent): void {
    console.log('👆 長按顯示詳情:', event.position);
    // 觸發上下文面板
    window.dispatchEvent(new CustomEvent('gesture:showContext', {
      detail: { position: event.position }
    }));
  }

  private handleTwoFingerTap(event: GestureEvent): void {
    console.log('✌️ 雙指點擊調整視角');
    // 觸發地圖視角調整
    window.dispatchEvent(new CustomEvent('gesture:adjustView', {
      detail: { position: event.position }
    }));
  }

  private handleThreeFingerTap(event: GestureEvent): void {
    console.log('🖐️ 三指點擊呼出AI');
    // 觸發AI助手
    window.dispatchEvent(new CustomEvent('gesture:showAI', {
      detail: { position: event.position }
    }));
  }

  private handleSwipeUp(event: GestureEvent): void {
    console.log('⬆️ 向上滑動顯示附近景點');
    // 觸發搜索或附近景點
    window.dispatchEvent(new CustomEvent('gesture:showNearby', {
      detail: { position: event.position }
    }));
  }

  private handleSwipeDown(event: GestureEvent): void {
    console.log('⬇️ 向下滑動隱藏界面');
    // 觸發界面隱藏
    window.dispatchEvent(new CustomEvent('gesture:hideUI', {
      detail: { position: event.position }
    }));
  }

  private handleCircularSwipe(event: GestureEvent): void {
    console.log('🔄 圓形手勢重置視角');
    // 觸發地圖重置
    window.dispatchEvent(new CustomEvent('gesture:resetView', {
      detail: { position: event.position }
    }));
  }

  // 銷毀手勢引擎
  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));

    this.clearLongPressTimer();
    this.gestures.clear();
  }

  // 獲取所有已註冊的手勢
  getRegisteredGestures(): GestureAction[] {
    return Array.from(this.gestures.values());
  }
}