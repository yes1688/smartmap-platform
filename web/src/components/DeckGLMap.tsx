import { Component, onMount, createEffect, createSignal, onCleanup } from 'solid-js';
import { Deck } from '@deck.gl/core';
import { IconLayer, ScatterplotLayer } from '@deck.gl/layers';
import { MapboxOverlay } from '@deck.gl/mapbox';
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
        attribution: 'Tiles © Esri — Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
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
      setPlayerPosition({
        latitude: player.latitude,
        longitude: player.longitude
      });
      updateRabbitLayer();
    }
  });

  // 創建兔子圖層
  const createRabbitLayer = () => {
    const player = gameStore.currentPlayer;
    if (!player) return [];

    return [
      new IconLayer({
        id: 'rabbit-layer',
        data: [{
          position: [player.longitude, player.latitude],
          size: 60,
          color: [255, 107, 107, 255], // 可愛的紅色兔子
          id: player.id
        }],
        iconAtlas: 'data:image/svg+xml;base64,' + btoa(`
          <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <!-- 兔子身體 -->
            <ellipse cx="32" cy="40" rx="18" ry="20" fill="#FFB6C1" stroke="#FF69B4" stroke-width="2"/>
            <!-- 兔子頭 -->
            <circle cx="32" cy="22" r="16" fill="#FFB6C1" stroke="#FF69B4" stroke-width="2"/>
            <!-- 兔子耳朵 -->
            <ellipse cx="24" cy="12" rx="4" ry="12" fill="#FFB6C1" stroke="#FF69B4" stroke-width="2"/>
            <ellipse cx="40" cy="12" rx="4" ry="12" fill="#FFB6C1" stroke="#FF69B4" stroke-width="2"/>
            <!-- 兔子眼睛 -->
            <circle cx="28" cy="18" r="3" fill="#000"/>
            <circle cx="36" cy="18" r="3" fill="#000"/>
            <!-- 兔子嘴巴 -->
            <path d="M28 26 Q32 28 36 26" stroke="#FF69B4" stroke-width="2" fill="none"/>
            <!-- 兔子尾巴 -->
            <circle cx="48" cy="45" r="6" fill="#FFB6C1" stroke="#FF69B4" stroke-width="1"/>
          </svg>
        `),
        iconMapping: {
          marker: { x: 0, y: 0, width: 64, height: 64 }
        },
        getIcon: () => 'marker',
        getPosition: (d: any) => d.position,
        getSize: (d: any) => d.size,
        getColor: (d: any) => d.color,
        billboard: false,
        sizeScale: 1,
        sizeUnits: 'pixels',
        updateTriggers: {
          getPosition: [player.latitude, player.longitude]
        }
      })
    ];
  };

  // 更新兔子圖層
  const updateRabbitLayer = () => {
    if (!overlay) return;

    const layers = createRabbitLayer();
    overlay.setProps({ layers });

    console.log('🐰 Updated rabbit position on map:', playerPosition());
  };

  onMount(() => {
    console.log('🗺️ Initializing DeckGL + MapLibre...');

    try {
      // 創建 MapLibre 地圖
      map = new maplibregl.Map({
        container: mapContainer,
        style: terrainMapStyle,
        center: [playerPosition().longitude, playerPosition().latitude],
        zoom: 15,
        pitch: 0,
        bearing: 0
      });

      map.on('load', () => {
        console.log('✅ MapLibre loaded successfully');

        // 創建 Deck.gl overlay
        overlay = new MapboxOverlay({
          layers: createRabbitLayer()
        });

        map!.addControl(overlay as any);
        console.log('✅ Deck.gl overlay added');
        console.log('🐰 Initial rabbit position:', playerPosition());
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
        <div class="text-sm font-semibold text-gray-800 mb-2">🐰 兔子狀態</div>
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
          💬 對 AI 說：<strong>「移動兔子到台北101」</strong>
        </div>
      </div>
    </div>
  );
};

export default DeckGLMap;