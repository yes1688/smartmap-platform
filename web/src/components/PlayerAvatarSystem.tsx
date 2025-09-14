import { onMount, onCleanup, createSignal } from 'solid-js';
import * as Cesium from 'cesium';

export interface PlayerData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  height?: number;
  color?: string;
  isCurrentPlayer?: boolean;
}

export interface PlayerAvatarSystemProps {
  viewer: Cesium.Viewer;
  players: PlayerData[];
  currentPlayerId?: string;
  onPlayerClick?: (playerId: string) => void;
}

export function createPlayerAvatarSystem(props: PlayerAvatarSystemProps) {
  const entities = new Map<string, Cesium.Entity>();

  // 創建玩偶的 3D 圖形使用 Cesium 的幾何體
  const createPlayerGeometry = (player: PlayerData) => {
    const position = Cesium.Cartesian3.fromDegrees(
      player.longitude,
      player.latitude,
      (player.height || 0) + 1.5 // 讓玩偶稍微離開地面
    );

    const isCurrentPlayer = player.id === props.currentPlayerId;
    const color = player.color || (isCurrentPlayer ? '#FF6B6B' : '#4ECDC4');

    // 使用 Cesium 的簡單幾何體組合創建玩偶
    const entity = props.viewer.entities.add({
      id: `player-${player.id}`,
      position: position,

      // 身體 - 使用圓柱體
      cylinder: {
        length: 3.0,
        topRadius: 0.8,
        bottomRadius: 0.8,
        material: Cesium.Color.fromCssColorString(color),
        outline: true,
        outlineColor: Cesium.Color.WHITE,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
      },

      // 標籤顯示玩家名稱
      label: {
        text: player.name,
        font: '16px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -60),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
      },

      // 點擊檢測
      properties: {
        playerId: player.id,
        playerName: player.name,
        isCurrentPlayer
      }
    });

    // 添加頭部
    const headEntity = props.viewer.entities.add({
      id: `player-head-${player.id}`,
      position: Cesium.Cartesian3.fromDegrees(
        player.longitude,
        player.latitude,
        (player.height || 0) + 3.5
      ),
      ellipsoid: {
        radii: new Cesium.Cartesian3(0.6, 0.6, 0.6),
        material: Cesium.Color.LIGHTSALMON,
        outline: true,
        outlineColor: Cesium.Color.WHITE,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
      }
    });

    // 如果是當前玩家，添加特殊標記
    if (isCurrentPlayer) {
      const pulseEntity = props.viewer.entities.add({
        id: `player-pulse-${player.id}`,
        position: position,
        ellipse: {
          semiMajorAxis: 3.0,
          semiMinorAxis: 3.0,
          material: new Cesium.ColorMaterialProperty(
            Cesium.Color.YELLOW.withAlpha(0.3)
          ),
          outline: true,
          outlineColor: Cesium.Color.YELLOW,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        }
      });

      // 添加脈衝動畫
      const startTime = props.viewer.clock.currentTime;
      pulseEntity.ellipse!.semiMajorAxis = new Cesium.CallbackProperty(() => {
        const elapsed = Cesium.JulianDate.secondsDifference(
          props.viewer.clock.currentTime,
          startTime
        );
        return 3.0 + Math.sin(elapsed * 2) * 0.5;
      }, false);

      pulseEntity.ellipse!.semiMinorAxis = new Cesium.CallbackProperty(() => {
        const elapsed = Cesium.JulianDate.secondsDifference(
          props.viewer.clock.currentTime,
          startTime
        );
        return 3.0 + Math.sin(elapsed * 2) * 0.5;
      }, false);
    }

    return { main: entity, head: headEntity };
  };

  // 添加所有玩家
  const addPlayers = () => {
    props.players.forEach(player => {
      const playerEntities = createPlayerGeometry(player);
      entities.set(player.id, playerEntities.main);
    });
    console.log(`🎮 Added ${props.players.length} players to map`, entities);
  };

  // 更新玩家位置
  const updatePlayerPosition = (playerId: string, position: { latitude: number, longitude: number, height?: number }) => {
    const entity = entities.get(playerId);
    if (entity) {
      const newPosition = Cesium.Cartesian3.fromDegrees(
        position.longitude,
        position.latitude,
        (position.height || 0) + 1.5
      );
      entity.position = newPosition;

      // 更新頭部位置
      const headEntity = props.viewer.entities.getById(`player-head-${playerId}`);
      if (headEntity) {
        headEntity.position = Cesium.Cartesian3.fromDegrees(
          position.longitude,
          position.latitude,
          (position.height || 0) + 3.5
        );
      }

      // 更新脈衝位置（如果是當前玩家）
      const pulseEntity = props.viewer.entities.getById(`player-pulse-${playerId}`);
      if (pulseEntity) {
        pulseEntity.position = newPosition;
      }
    }
  };

  // 移除玩家
  const removePlayer = (playerId: string) => {
    const entity = entities.get(playerId);
    if (entity) {
      props.viewer.entities.remove(entity);
      entities.delete(playerId);
    }

    // 移除頭部
    const headEntity = props.viewer.entities.getById(`player-head-${playerId}`);
    if (headEntity) {
      props.viewer.entities.remove(headEntity);
    }

    // 移除脈衝
    const pulseEntity = props.viewer.entities.getById(`player-pulse-${playerId}`);
    if (pulseEntity) {
      props.viewer.entities.remove(pulseEntity);
    }
  };

  // 清理所有玩家
  const clear = () => {
    entities.forEach((entity, playerId) => {
      removePlayer(playerId);
    });
    entities.clear();
  };

  // 設置點擊事件
  const setupClickHandler = () => {
    props.viewer.cesiumWidget.screenSpaceEventHandler.setInputAction((event: any) => {
      const pickedObject = props.viewer.scene.pick(event.position);
      if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
        const entity = pickedObject.id;
        if (entity.properties && entity.properties.playerId) {
          props.onPlayerClick?.(entity.properties.playerId.getValue());
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  };

  return {
    addPlayers,
    updatePlayerPosition,
    removePlayer,
    clear,
    setupClickHandler,
    entities: () => entities
  };
}

// SolidJS 組件包裝器
export function PlayerAvatarSystem(props: PlayerAvatarSystemProps) {
  let avatarSystem: ReturnType<typeof createPlayerAvatarSystem>;

  onMount(() => {
    avatarSystem = createPlayerAvatarSystem(props);
    avatarSystem.addPlayers();
    avatarSystem.setupClickHandler();
  });

  onCleanup(() => {
    if (avatarSystem) {
      avatarSystem.clear();
    }
  });

  // 當玩家數據變化時更新
  const updatePlayers = () => {
    if (avatarSystem) {
      avatarSystem.clear();
      avatarSystem.addPlayers();
    }
  };

  return null; // 此組件不渲染 DOM，只管理 Cesium 實體
}

// 用戶位置獲取工具
export function useGeolocation() {
  const [position, setPosition] = createSignal<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);

  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setError('瀏覽器不支援地理位置功能');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const watchPosition = (callback: (position: { latitude: number; longitude: number }) => void) => {
    if (!navigator.geolocation) {
      setError('瀏覽器不支援地理位置功能');
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        setPosition(newPos);
        callback(newPos);
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );

    return watchId;
  };

  return {
    position,
    error,
    loading,
    getCurrentPosition,
    watchPosition
  };
}