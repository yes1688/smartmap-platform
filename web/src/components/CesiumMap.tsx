import { Component, onMount, onCleanup, createSignal } from 'solid-js';
import * as Cesium from 'cesium';
import { CONFIG } from '@/config';
import type { HistoricalSite } from '@/types';

interface CesiumMapProps {
  onPlayerMove: (latitude: number, longitude: number) => void;
  onHistoricalSiteClick: (site: HistoricalSite) => void;
}

const CesiumMap: Component<CesiumMapProps> = (props) => {
  let mapContainer: HTMLDivElement;
  let viewer: Cesium.Viewer | undefined;

  // 即時位置監控
  const [currentPosition, setCurrentPosition] = createSignal({
    latitude: 25.0330,
    longitude: 121.5654,
    altitude: 1000000,
    lastUpdate: new Date()
  });

  const [cameraInfo, setCameraInfo] = createSignal({
    heading: 0,
    pitch: -90,
    roll: 0,
    height: 1000000
  });

  onMount(() => {
    console.log('🌍 Initializing CesiumJS...');

    try {
      // Set access token
      Cesium.Ion.defaultAccessToken = CONFIG.cesium.accessToken;
      console.log('✅ Cesium Ion token configured');

      // Create viewer with minimal UI controls
      viewer = new Cesium.Viewer(mapContainer, {
        // Disable most UI elements for cleaner look
        animation: false,           // 底部動畫控制器
        baseLayerPicker: false,     // 右上角圖層選擇器
        fullscreenButton: false,    // 右下角全屏按鈕
        geocoder: false,            // 右上角搜索框
        homeButton: true,           // 保留首頁按鈕
        infoBox: false,             // 點擊信息框
        sceneModePicker: false,     // 右上角 2D/3D 切換
        selectionIndicator: false,  // 選擇指示器
        timeline: false,            // 底部時間軸
        navigationHelpButton: false, // 右上角幫助按鈕
        navigationInstructionsInitiallyVisible: false
      });
      console.log('✅ CesiumJS Viewer Created:', viewer);

      // Fly to Taiwan
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(121.5654, 25.0330, 1000000)
      });

      console.log('Canvas size:', viewer.canvas.width, 'x', viewer.canvas.height);

      // Global access for debugging
      (window as any).cesiumViewer = viewer;

      // 即時監控相機位置變化
      viewer.camera.changed.addEventListener(() => {
        const cameraPosition = viewer!.camera.positionCartographic;
        const longitude = Cesium.Math.toDegrees(cameraPosition.longitude);
        const latitude = Cesium.Math.toDegrees(cameraPosition.latitude);
        const altitude = cameraPosition.height;

        // 更新相機信息
        setCameraInfo({
          heading: Cesium.Math.toDegrees(viewer!.camera.heading),
          pitch: Cesium.Math.toDegrees(viewer!.camera.pitch),
          roll: Cesium.Math.toDegrees(viewer!.camera.roll),
          height: altitude
        });

        // 更新當前位置（視角中心）
        setCurrentPosition({
          latitude,
          longitude,
          altitude,
          lastUpdate: new Date()
        });
      });

      // 點擊地圖處理
      viewer.cesiumWidget.screenSpaceEventHandler.setInputAction((click) => {
        const pickedPosition = viewer!.camera.pickEllipsoid(click.position, viewer!.scene.globe.ellipsoid);
        if (pickedPosition) {
          const cartographic = Cesium.Cartographic.fromCartesian(pickedPosition);
          const longitude = Cesium.Math.toDegrees(cartographic.longitude);
          const latitude = Cesium.Math.toDegrees(cartographic.latitude);

          console.log(`🎯 點擊位置: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);

          // 飛行到點擊位置
          viewer!.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 100000),
            duration: 1.5
          });

          props.onPlayerMove(latitude, longitude);
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      console.log('🌍 CesiumJS initialization completed successfully!');

    } catch (error) {
      console.error('❌ CesiumJS initialization failed:', error);
    }
  });

  onCleanup(() => {
    if (viewer && !viewer.isDestroyed()) {
      viewer.destroy();
      console.log('🧹 Cesium viewer cleaned up');
    }
  });

  return (
    <div class="w-full h-full relative">
      {/* Cesium Container */}
      <div
        ref={mapContainer!}
        class="w-full h-full"
        style="min-height: 400px; height: calc(100vh - 65px); background: #000;"
      />

      {/* 整合監控面板 */}
      <div class="absolute top-4 left-4 bg-black/85 backdrop-blur text-white p-3 rounded-lg z-10 w-80 max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        <div class="space-y-3">
          {/* 標題 */}
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div class="text-sm font-semibold">🌍 智能空間控制台</div>
            </div>
          </div>

          <div class="border-b border-white/20"></div>

          {/* 即時位置監控 */}
          <div class="space-y-2">
            <div class="text-xs text-green-400 font-medium">即時位置監控</div>
            <div class="grid grid-cols-2 gap-2 text-xs font-mono bg-white/10 p-2 rounded">
              <div>緯度: {currentPosition().latitude.toFixed(6)}°</div>
              <div>經度: {currentPosition().longitude.toFixed(6)}°</div>
            </div>
            <div class="text-xs font-mono bg-white/10 p-2 rounded">
              高度: {(currentPosition().altitude / 1000).toFixed(1)} km
            </div>
          </div>

          {/* 相機角度 */}
          <div class="space-y-2">
            <div class="text-xs text-blue-400 font-medium">相機角度</div>
            <div class="grid grid-cols-3 gap-1 text-xs font-mono">
              <div class="bg-white/10 p-1 rounded text-center">
                <div>偏航</div>
                <div class="text-blue-300">{cameraInfo().heading.toFixed(1)}°</div>
              </div>
              <div class="bg-white/10 p-1 rounded text-center">
                <div>俯仰</div>
                <div class="text-blue-300">{cameraInfo().pitch.toFixed(1)}°</div>
              </div>
              <div class="bg-white/10 p-1 rounded text-center">
                <div>翻滾</div>
                <div class="text-blue-300">{cameraInfo().roll.toFixed(1)}°</div>
              </div>
            </div>
          </div>

          <div class="border-b border-white/20"></div>

          {/* 遊戲數據 */}
          <div class="space-y-2">
            <div class="text-xs text-yellow-400 font-medium">遊戲數據</div>
            <div class="grid gap-2">
              <div class="flex items-center justify-between bg-white/10 p-2 rounded">
                <div class="flex items-center space-x-2">
                  <div class="text-blue-400">🏆</div>
                  <span class="text-xs">等級</span>
                </div>
                <span class="text-sm font-bold">1</span>
              </div>
              <div class="flex items-center justify-between bg-white/10 p-2 rounded">
                <div class="flex items-center space-x-2">
                  <div class="text-emerald-400">⭐</div>
                  <span class="text-xs">積分</span>
                </div>
                <span class="text-sm font-bold">0</span>
              </div>
              <div class="flex items-center justify-between bg-white/10 p-2 rounded">
                <div class="flex items-center space-x-2">
                  <div class="text-purple-400">💎</div>
                  <span class="text-xs">道具</span>
                </div>
                <span class="text-sm font-bold">0</span>
              </div>
            </div>
          </div>

          <div class="border-b border-white/20"></div>

          {/* 系統狀態 */}
          <div class="space-y-2">
            <div class="text-xs text-emerald-400 font-medium">系統狀態</div>
            <div class="flex items-center justify-between bg-white/10 p-2 rounded">
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span class="text-xs">運行中</span>
              </div>
              <div class="flex items-center space-x-1">
                <div class="w-1 h-3 bg-emerald-400 rounded-full"></div>
                <div class="w-1 h-3 bg-emerald-400 rounded-full"></div>
                <div class="w-1 h-3 bg-emerald-400 rounded-full"></div>
                <span class="text-xs text-emerald-300">優良</span>
              </div>
            </div>
          </div>

          <div class="border-b border-white/20"></div>

          {/* 最近活動 */}
          <div class="space-y-2">
            <div class="text-xs text-orange-400 font-medium">最近活動</div>
            <div class="space-y-1">
              <div class="flex items-center space-x-2 bg-white/10 p-2 rounded text-xs">
                <span>🗺️</span>
                <div class="flex-1">
                  <div>探索新區域</div>
                  <div class="text-xs text-gray-400">2分鐘前</div>
                </div>
              </div>
              <div class="flex items-center space-x-2 bg-white/10 p-2 rounded text-xs">
                <span>🏆</span>
                <div class="flex-1">
                  <div>獲得成就獎勵</div>
                  <div class="text-xs text-gray-400">5分鐘前</div>
                </div>
              </div>
              <div class="flex items-center space-x-2 bg-white/10 p-2 rounded text-xs">
                <span>💬</span>
                <div class="flex-1">
                  <div>與AI助手對話</div>
                  <div class="text-xs text-gray-400">12分鐘前</div>
                </div>
              </div>
            </div>
          </div>

          {/* 最後更新時間 */}
          <div class="text-xs text-gray-400 text-center border-t border-white/20 pt-2">
            更新: {currentPosition().lastUpdate.toLocaleTimeString()}
          </div>

          {/* 操作提示 */}
          <div class="text-xs text-blue-200 bg-blue-500/20 p-2 rounded">
            💡 點擊地圖任意處快速飛行到該位置
          </div>
        </div>
      </div>
    </div>
  );
};

export default CesiumMap;