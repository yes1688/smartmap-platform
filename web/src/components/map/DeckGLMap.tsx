import { Component, onMount, createEffect, createSignal, onCleanup } from 'solid-js';
import { Deck } from '@deck.gl/core';
import { IconLayer, ScatterplotLayer } from '@deck.gl/layers';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { registerLoaders } from '@loaders.gl/core';
import { OBJLoader } from '@loaders.gl/obj';
import maplibregl from 'maplibre-gl';
import { gameStore } from '@/stores/gameStore';

interface DeckGLMapProps {
  onPlayerMove: (latitude: number, longitude: number) => void;
  onHistoricalSiteClick?: (site: any) => void;
}

const DeckGLMap: Component<DeckGLMapProps> = (props) => {
  let mapContainer: HTMLDivElement;
  let map: maplibregl.Map | undefined;
  let overlay: MapboxOverlay | undefined;

  const [playerPosition, setPlayerPosition] = createSignal({
    latitude: 25.0330,
    longitude: 121.5654
  });

  // 固定使用地形圖樣式
  const terrainMapStyle = {
    version: 8,
    sources: {
      'terrain': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: '© Esri'  // 簡化版權信息
      }
    },
    layers: [{
      id: 'terrain',
      type: 'raster',
      source: 'terrain'
    }]
  };

  // 監聽 gameStore 中的玩家位置變化 - 這就是修復兔子移動的關鍵！
  createEffect(() => {
    const player = gameStore.currentPlayer;
    if (player && (player.latitude !== playerPosition().latitude || player.longitude !== playerPosition().longitude)) {
      console.log('🎮 DeckGL detected player position change:', player.latitude, player.longitude);

      const newPosition = {
        latitude: player.latitude,
        longitude: player.longitude
      };

      setPlayerPosition(newPosition);
      updateCatLayer();

      // 🌟 新增：地圖視窗跟隨兔子移動
      if (map) {
        console.log('🗺️ Moving map viewport to follow cat:', newPosition);
        map.easeTo({
          center: [player.longitude, player.latitude],
          zoom: 16, // 放大1級來更清楚查看貓咪
          duration: 2000, // 2秒的平滑動畫
          essential: true // 確保動畫會執行
        });
      }
    }
  });

  // 創建精美動物圖層 (使用真實貓咪模型)
  const createCatLayer = () => {
    const player = gameStore.currentPlayer;
    console.log('🐱 Creating beautiful cat OBJ model, player data:', player);
    if (!player) {
      console.warn('⚠️ No player data available for cat layer');
      return [];
    }

    // 🐱 精美貓咪模型數據
    const catModelData = [{
      position: [player.longitude, player.latitude, 8],
      scale: [2.0, 2.0, 2.0], // 巨無霸貓咪！
      rotation: [0, Math.PI/2, 0], // 正常站立 + 90度側身
      color: [255, 255, 255, 255], // 使用模型原始顏色
      id: player.id + '-beautiful-cat'
    }];

    console.log('🐱 Beautiful cat OBJ model layers: 2 total');
    console.log('🐱 Cat position: [lng, lat, z]', [player.longitude, player.latitude, 8]);

    return [
      // 🎯 2D地面指示器：確保貓咪位置可見
      new ScatterplotLayer({
        id: 'cat-ground-indicator',
        data: [{
          position: [player.longitude, player.latitude],
          size: 12,
          color: [255, 165, 0, 150] // 橘色指示器配合貓咪
        }],
        getPosition: (d: any) => d.position,
        getRadius: (d: any) => d.size,
        getFillColor: (d: any) => d.color,
        radiusUnits: 'meters',
        pickable: true,
        stroked: true,
        filled: true,
        lineWidthMinPixels: 3,
        getLineColor: [255, 140, 0, 255], // 深橘色邊框
        updateTriggers: {
          getPosition: [player.latitude, player.longitude]
        }
      }),

      // 🐱 精美貓咪 3D OBJ 模型
      new SimpleMeshLayer({
        id: 'beautiful-cat-model',
        data: catModelData,
        mesh: '/models/12221_Cat_v1_l3.obj', // 使用你下載的真實貓咪模型
        getPosition: (d: any) => d.position,
        getScale: (d: any) => d.scale,
        getOrientation: (d: any) => d.rotation,
        getColor: [139, 69, 19, 255], // 咖啡色貓咪
        pickable: true,
        material: {
          ambient: 1.0,  // 增強環境光
          diffuse: 1.0,  // 增強漫射光
          shininess: 32,
          specularColor: [255, 255, 255]
        },
        updateTriggers: {
          getPosition: [player.latitude, player.longitude]
        }
      })
    ];
  };

  // 更新貓咪圖層
  const updateCatLayer = () => {
    if (!overlay) {
      console.warn('⚠️ Overlay not available for cat layer update');
      return;
    }

    const layers = createCatLayer();
    overlay.setProps({ layers });

    console.log('🐱 Updated cat position on map:', playerPosition());
    console.log('🐱 Updated layers count:', layers.length);
  };

  onMount(() => {
    console.log('🗺️ Initializing DeckGL + MapLibre...');

    // 註冊 OBJ 載入器載入精美貓咪模型
    registerLoaders([OBJLoader]);
    console.log('✅ OBJLoader registered for beautiful cat model');

    try {
      // 創建 MapLibre 地圖
      map = new maplibregl.Map({
        container: mapContainer,
        style: terrainMapStyle,
        center: [playerPosition().longitude, playerPosition().latitude],
        zoom: 16,
        pitch: 30, // 30度傾斜角，提供3D視角
        bearing: 0,
        attributionControl: false  // 關閉預設版權控制元件
      });

      map.on('load', () => {
        console.log('✅ MapLibre loaded successfully');

        // 創建 Deck.gl overlay
        const initialLayers = createCatLayer();
        overlay = new MapboxOverlay({
          layers: initialLayers
        });

        map!.addControl(overlay as any);

        // 添加簡潔的版權控制元件
        map!.addControl(new maplibregl.AttributionControl({
          compact: true,  // 使用緊湊模式
          customAttribution: '© Esri'  // 自定義簡短版權
        }), 'bottom-right');

        console.log('✅ Deck.gl overlay added');
        console.log('🐱 Initial cat position:', playerPosition());
        console.log('🐱 Cat layers created:', initialLayers.length);

        // 確保貓咪圖層立即可見
        if (initialLayers.length > 0) {
          console.log('✅ Cat layer is visible on map');
        } else {
          console.warn('⚠️ No cat layers created - check player data');
        }
      });

      // 監聽地圖移動
      map.on('moveend', () => {
        const center = map!.getCenter();
        console.log('🗺️ Map moved to:', center.lat, center.lng);
      });

    } catch (error) {
      console.error('❌ DeckGL initialization failed:', error);
    }
  });

  onCleanup(() => {
    if (overlay) {
      overlay.finalize();
    }
    if (map) {
      map.remove();
    }
    console.log('🧹 DeckGL map cleaned up');
  });

  return (
    <div class="w-full h-full relative">
      {/* MapLibre Container */}
      <div
        ref={mapContainer!}
        class="w-full h-full"
        style="min-height: 400px; height: calc(100vh - 65px);"
      />

      {/* 簡潔的狀態面板 */}
      <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10">
        <div class="text-sm font-semibold text-gray-800 mb-2">🐱 小貓咪狀態</div>
        <div class="text-xs text-gray-600 space-y-1">
          <div>緯度: {playerPosition().latitude.toFixed(4)}°</div>
          <div>經度: {playerPosition().longitude.toFixed(4)}°</div>
          <div class="flex items-center gap-2 mt-2">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-green-600 font-medium">在線</span>
          </div>
        </div>
      </div>


      {/* 使用提示 */}
      <div class="absolute bottom-4 left-4 bg-blue-50/90 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10">
        <div class="text-sm text-blue-800">
          💬 對 AI 說：<strong>「移動小貓咪到台北101」</strong>
        </div>
      </div>
    </div>
  );
};

export default DeckGLMap;