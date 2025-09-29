export interface AnimationConfig {
  duration: number;
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | 'spring' | 'bounce';
  delay?: number;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface SpringConfig {
  tension: number;
  friction: number;
  mass?: number;
}

export interface AnimationTarget {
  element: HTMLElement;
  property: string;
  from: string | number;
  to: string | number;
  unit?: string;
}

export class AnimationEngine {
  private activeAnimations: Map<string, Animation> = new Map();
  private rafId: number | null = null;
  private timeline: Animation[] = [];

  // 預設動畫配置
  static readonly PRESETS = {
    gentle: { duration: 300, easing: 'ease-out' as const },
    quick: { duration: 150, easing: 'ease-in-out' as const },
    smooth: { duration: 500, easing: 'ease' as const },
    bounce: { duration: 600, easing: 'bounce' as const },
    spring: { duration: 400, easing: 'spring' as const },
    fluid: { duration: 800, easing: 'ease-in-out' as const }
  };

  // 創建單個動畫
  animate(target: AnimationTarget, config: AnimationConfig): Promise<void> {
    return new Promise((resolve) => {
      const animationId = `${target.element.id || 'el'}_${target.property}_${Date.now()}`;

      // 停止同類型的現有動畫
      this.stopAnimation(animationId);

      const keyframes = this.generateKeyframes(target);
      const timing: KeyframeAnimationOptions = {
        duration: config.duration,
        easing: this.getEasingFunction(config.easing),
        delay: config.delay || 0,
        iterations: config.iterations || 1,
        direction: config.direction || 'normal',
        fill: config.fillMode || 'forwards'
      };

      const animation = target.element.animate(keyframes, timing);

      animation.onfinish = () => {
        this.activeAnimations.delete(animationId);
        resolve();
      };

      animation.oncancel = () => {
        this.activeAnimations.delete(animationId);
        resolve();
      };

      this.activeAnimations.set(animationId, animation);
    });
  }

  // 創建序列動畫
  sequence(animations: Array<{ target: AnimationTarget; config: AnimationConfig }>): Promise<void> {
    return animations.reduce((promise, { target, config }) => {
      return promise.then(() => this.animate(target, config));
    }, Promise.resolve());
  }

  // 創建並行動畫
  parallel(animations: Array<{ target: AnimationTarget; config: AnimationConfig }>): Promise<void> {
    const promises = animations.map(({ target, config }) => this.animate(target, config));
    return Promise.all(promises).then(() => void 0);
  }

  // 延遲動畫
  stagger(
    animations: Array<{ target: AnimationTarget; config: AnimationConfig }>,
    staggerDelay: number = 100
  ): Promise<void> {
    const promises = animations.map(({ target, config }, index) => {
      const staggeredConfig = {
        ...config,
        delay: (config.delay || 0) + (index * staggerDelay)
      };
      return this.animate(target, staggeredConfig);
    });
    return Promise.all(promises).then(() => void 0);
  }

  // 智能進場動畫
  smartEnter(element: HTMLElement, type: 'fade' | 'slide' | 'scale' | 'flip' = 'fade'): Promise<void> {
    const rect = element.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

    if (!isVisible) {
      // 如果元素不在視窗內，等待滾動到可見位置
      return this.waitForVisible(element).then(() => this.performEnterAnimation(element, type));
    }

    return this.performEnterAnimation(element, type);
  }

  // 智能離場動畫
  smartExit(element: HTMLElement, type: 'fade' | 'slide' | 'scale' | 'flip' = 'fade'): Promise<void> {
    return this.performExitAnimation(element, type);
  }

  // 創建彈性動畫（仿 iOS）
  springAnimation(
    target: AnimationTarget,
    springConfig: SpringConfig = { tension: 170, friction: 26, mass: 1 }
  ): Promise<void> {
    const duration = this.calculateSpringDuration(springConfig);
    const easing = this.createSpringEasing(springConfig);

    return this.animate(target, {
      duration,
      easing: 'ease-out', // 使用標準緩動作為後備
      fillMode: 'forwards'
    });
  }

  // Morphism 玻璃效果動畫
  glassMorphism(element: HTMLElement, intensity: number = 20): Promise<void> {
    const keyframes = [
      {
        backdropFilter: 'blur(0px)',
        background: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.2)'
      },
      {
        backdropFilter: `blur(${intensity}px)`,
        background: 'rgba(255, 255, 255, 0.25)',
        borderColor: 'rgba(255, 255, 255, 0.4)'
      }
    ];

    const animation = element.animate(keyframes, {
      duration: 600,
      easing: 'ease-out',
      fill: 'forwards'
    });

    return new Promise(resolve => {
      animation.onfinish = () => resolve();
    });
  }

  // 智能視差效果
  parallax(elements: HTMLElement[], scrollContainer?: HTMLElement): void {
    const container = scrollContainer || window;

    const updateParallax = () => {
      const scrollY = container instanceof Window ?
        container.scrollY : container.scrollTop;

      elements.forEach((element, index) => {
        const speed = 0.5 + (index * 0.1); // 不同元素不同速度
        const yPos = -(scrollY * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });
    };

    container.addEventListener('scroll', updateParallax, { passive: true });
    updateParallax(); // 初始化位置
  }

  // 磁吸效果動畫
  magneticEffect(element: HTMLElement, strength: number = 0.3): void {
    const bounds = element.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    };

    const handleMouseLeave = () => {
      element.style.transform = 'translate(0px, 0px)';
    };

    element.addEventListener('mouseenter', () => {
      document.addEventListener('mousemove', handleMouseMove);
    });

    element.addEventListener('mouseleave', () => {
      document.removeEventListener('mousemove', handleMouseMove);
      handleMouseLeave();
    });
  }

  // 連鎖動畫效果
  chainReaction(
    elements: HTMLElement[],
    animationType: 'ripple' | 'wave' | 'domino' = 'ripple',
    triggerElement?: HTMLElement
  ): Promise<void> {
    const trigger = triggerElement || elements[0];
    const triggerRect = trigger.getBoundingClientRect();

    // 計算每個元素與觸發點的距離
    const distances = elements.map(el => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const triggerCenterX = triggerRect.left + triggerRect.width / 2;
      const triggerCenterY = triggerRect.top + triggerRect.height / 2;

      return Math.sqrt(
        Math.pow(centerX - triggerCenterX, 2) +
        Math.pow(centerY - triggerCenterY, 2)
      );
    });

    // 根據距離排序元素
    const sortedElements = elements
      .map((el, index) => ({ element: el, distance: distances[index] }))
      .sort((a, b) => a.distance - b.distance);

    // 執行連鎖動畫
    return this.stagger(
      sortedElements.map(({ element }) => ({
        target: { element, property: 'transform', from: 'scale(1)', to: 'scale(1.1)', unit: '' },
        config: { ...AnimationEngine.PRESETS.quick, direction: 'alternate' }
      })),
      50
    );
  }

  // 停止指定動畫
  stopAnimation(animationId: string): void {
    const animation = this.activeAnimations.get(animationId);
    if (animation) {
      animation.cancel();
      this.activeAnimations.delete(animationId);
    }
  }

  // 停止所有動畫
  stopAllAnimations(): void {
    this.activeAnimations.forEach(animation => animation.cancel());
    this.activeAnimations.clear();
  }

  // 私有輔助方法
  private generateKeyframes(target: AnimationTarget): Keyframe[] {
    const property = this.camelToKebab(target.property);
    const unit = target.unit || '';

    return [
      { [property]: `${target.from}${unit}` },
      { [property]: `${target.to}${unit}` }
    ];
  }

  private getEasingFunction(easing: AnimationConfig['easing']): string {
    const easingMap: Record<string, string> = {
      'ease': 'ease',
      'ease-in': 'ease-in',
      'ease-out': 'ease-out',
      'ease-in-out': 'ease-in-out',
      'linear': 'linear',
      'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    };

    return easingMap[easing] || 'ease';
  }

  private performEnterAnimation(element: HTMLElement, type: string): Promise<void> {
    const animations: Record<string, AnimationTarget> = {
      fade: { element, property: 'opacity', from: 0, to: 1 },
      slide: { element, property: 'transform', from: 'translateY(30px)', to: 'translateY(0px)' },
      scale: { element, property: 'transform', from: 'scale(0.8)', to: 'scale(1)' },
      flip: { element, property: 'transform', from: 'rotateY(-90deg)', to: 'rotateY(0deg)' }
    };

    return this.animate(animations[type], AnimationEngine.PRESETS.smooth);
  }

  private performExitAnimation(element: HTMLElement, type: string): Promise<void> {
    const animations: Record<string, AnimationTarget> = {
      fade: { element, property: 'opacity', from: 1, to: 0 },
      slide: { element, property: 'transform', from: 'translateY(0px)', to: 'translateY(-30px)' },
      scale: { element, property: 'transform', from: 'scale(1)', to: 'scale(0.8)' },
      flip: { element, property: 'transform', from: 'rotateY(0deg)', to: 'rotateY(90deg)' }
    };

    return this.animate(animations[type], AnimationEngine.PRESETS.quick);
  }

  private waitForVisible(element: HTMLElement): Promise<void> {
    return new Promise(resolve => {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(element);
    });
  }

  private calculateSpringDuration(config: SpringConfig): number {
    // 基於物理參數計算彈性動畫時長
    const { tension, friction, mass = 1 } = config;
    const w0 = Math.sqrt(tension / mass);
    const zeta = friction / (2 * Math.sqrt(tension * mass));

    if (zeta < 1) {
      // 欠阻尼
      const wd = w0 * Math.sqrt(1 - zeta * zeta);
      return (4 / wd) * 1000; // 轉換為毫秒
    } else {
      // 過阻尼或臨界阻尼
      return (4 / w0) * 1000;
    }
  }

  private createSpringEasing(config: SpringConfig): string {
    // 簡化的彈性緩動曲線
    const { tension, friction } = config;
    const normalizedTension = Math.min(Math.max(tension / 300, 0), 1);
    const normalizedFriction = Math.min(Math.max(friction / 40, 0), 1);

    return `cubic-bezier(${0.25 + normalizedTension * 0.25}, ${0.1 + normalizedFriction * 0.4}, ${0.75 - normalizedTension * 0.25}, ${1 - normalizedFriction * 0.1})`;
  }

  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  // 銷毀動畫引擎
  destroy(): void {
    this.stopAllAnimations();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
}

// 創建全局動畫引擎實例
export const animationEngine = new AnimationEngine();

// 便捷的動畫方法
export const smoothTransition = (element: HTMLElement, property: string, to: string | number, duration = 300) => {
  return animationEngine.animate(
    { element, property, from: getComputedStyle(element)[property as any], to, unit: '' },
    { duration, easing: 'ease-out' }
  );
};

export const fadeIn = (element: HTMLElement, duration = 300) => {
  return animationEngine.smartEnter(element, 'fade');
};

export const fadeOut = (element: HTMLElement, duration = 300) => {
  return animationEngine.smartExit(element, 'fade');
};

export const slideIn = (element: HTMLElement, duration = 400) => {
  return animationEngine.smartEnter(element, 'slide');
};

export const scaleIn = (element: HTMLElement, duration = 300) => {
  return animationEngine.smartEnter(element, 'scale');
};