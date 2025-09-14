import { Component, onMount, onCleanup, createSignal, For } from 'solid-js';
import * as Cesium from 'cesium';
import { CONFIG } from '@/config';
import type { HistoricalSite } from '@/types';
import '@/styles/scrollbar.css';

interface CesiumMapProps {
  onPlayerMove: (latitude: number, longitude: number) => void;
  onHistoricalSiteClick: (site: HistoricalSite) => void;
}

const CesiumMap: Component<CesiumMapProps> = (props) => {
  let mapContainer: HTMLDivElement;
  let viewer: Cesium.Viewer | undefined;

  // 即時位置監控 - 相機位置
  const [currentPosition, setCurrentPosition] = createSignal({
    latitude: 25.0330,
    longitude: 121.5654,
    altitude: 1000000,
    lastUpdate: new Date()
  });

  // 用戶真實位置監控
  const [userRealPosition, setUserRealPosition] = createSignal({
    latitude: null as number | null,
    longitude: null as number | null,
    accuracy: null as number | null,
    timestamp: null as Date | null,
    error: null as string | null,
    isTracking: false
  });

  // 點擊狀態管理 - 兩階段縮放系統
  const [clickState, setClickState] = createSignal({
    lastClickPosition: { lat: 0, lng: 0 },
    isFirstClick: true,
    clickRadius: 0.05, // 判斷是否點擊同一位置的容差範圍（約5公里）
    lastClickTime: 0
  });

  const [cameraInfo, setCameraInfo] = createSignal({
    heading: 0,
    pitch: -90,
    roll: 0,
    height: 1000000
  });

  // 標籤頁狀態
  const [activeTab, setActiveTab] = createSignal('location');

  // 消息系統
  const [messages, setMessages] = createSignal([
    {
      id: 1,
      type: 'success',
      title: '系統啟動',
      content: '智能空間平台已成功初始化',
      timestamp: new Date(),
      read: false
    },
    {
      id: 2,
      type: 'info',
      title: '位置追蹤',
      content: '點擊上方按鈕開始GPS定位',
      timestamp: new Date(Date.now() - 60000),
      read: false
    }
  ]);

  let messageContainer: HTMLDivElement;

  const addMessage = (type: 'success' | 'info' | 'warning' | 'error', title: string, content: string) => {
    const newMessage = {
      id: Date.now(),
      type,
      title,
      content,
      timestamp: new Date(),
      read: false
    };
    setMessages(prev => [newMessage, ...prev].slice(0, 10)); // 新訊息置頂，只保留最新10條消息

    // 自動滾動到頂部
    setTimeout(() => {
      if (messageContainer) {
        messageContainer.scrollTop = 0;
      }
    }, 10);
  };

  // 地理位置追蹤功能
  const startLocationTracking = () => {
    console.log('🔥 GPS按鈕被點擊!');
    console.log('🔍 檢查地理位置API支援:', !!navigator.geolocation);
    console.log('🌐 當前協議:', window.location.protocol);
    console.log('🏠 當前域名:', window.location.hostname);

    addMessage('info', '位置追蹤', '正在啟動GPS定位...');

    if (!navigator.geolocation) {
      console.error('❌ 瀏覽器不支援地理位置');
      setUserRealPosition(prev => ({
        ...prev,
        error: '此瀏覽器不支援地理位置功能',
        isTracking: false
      }));
      addMessage('error', 'GPS錯誤', '瀏覽器不支援地理位置');
      return;
    }

    // 檢查權限
    if ('permissions' in navigator) {
      navigator.permissions.query({name: 'geolocation'}).then((result) => {
        console.log('📍 地理位置權限狀態:', result.state);
        addMessage('info', 'GPS權限', `權限狀態: ${result.state}`);
      });
    }

    setUserRealPosition(prev => ({
      ...prev,
      isTracking: true,
      error: null
    }));

    // 獲取當前位置
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserRealPosition({
          latitude,
          longitude,
          accuracy,
          timestamp: new Date(),
          error: null,
          isTracking: true
        });
        console.log('📍 獲取用戶位置:', latitude, longitude, '精度:', accuracy, 'm');

        // 添加成功消息
        addMessage('success', 'GPS定位成功', `位置: ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}° (±${accuracy?.toFixed(0)}m)`);

        // 通知父組件更新玩家位置
        props.onPlayerMove(latitude, longitude);

        // 飛行到用戶位置並添加GPS標記
        if (viewer) {
          // 清除之前的GPS標記
          viewer.entities.removeAll();

          // 添加GPS位置標記
          viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
            point: {
              pixelSize: 20,
              color: Cesium.Color.YELLOW,
              outlineColor: Cesium.Color.RED,
              outlineWidth: 3,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            },
            label: {
              text: '📍 我的位置',
              font: '14pt sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -50),
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
          });

          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 1000),
            duration: 2.0
          });
        }
      },
      (error) => {
        let errorMessage = '獲取位置失敗';
        let detailMessage = '';

        console.log('❌ GPS錯誤詳情:', error);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '用戶拒絕地理位置請求';
            detailMessage = '請允許位置權限或檢查瀏覽器設置';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置信息不可用';
            detailMessage = '無法獲取GPS信號，請到戶外重試';
            break;
          case error.TIMEOUT:
            errorMessage = '獲取位置超時';
            detailMessage = '請確保GPS已開啟，或到信號較好的地方';
            break;
          default:
            detailMessage = `錯誤代碼: ${error.code}`;
        }

        console.error('❌ 地理位置錯誤:', errorMessage, detailMessage);

        setUserRealPosition(prev => ({
          ...prev,
          error: errorMessage,
          isTracking: false
        }));

        addMessage('error', 'GPS定位失敗', `${errorMessage} - ${detailMessage}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5分鐘緩存
      }
    );

    // 持續監控位置變化
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserRealPosition({
          latitude,
          longitude,
          accuracy,
          timestamp: new Date(),
          error: null,
          isTracking: true
        });
        console.log('🔄 位置更新:', latitude, longitude);
        props.onPlayerMove(latitude, longitude);

        // 更新GPS位置標記
        if (viewer) {
          viewer.entities.removeAll();
          viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
            point: {
              pixelSize: 20,
              color: Cesium.Color.LIME,
              outlineColor: Cesium.Color.DARKGREEN,
              outlineWidth: 3,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            },
            label: {
              text: '📍 即時位置',
              font: '14pt sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -50),
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
          });
        }
      },
      (error) => {
        console.warn('⚠️ 位置監控警告:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000 // 30秒緩存
      }
    );

    // 清理函數儲存
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  };

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

      // 啟用立體建築物和地形 + Google地圖底圖
      const load3DFeatures = async () => {
        try {
          // 1. 添加Google Maps街道地圖 (標準底圖)
          const googleMapsImageryProvider = new Cesium.UrlTemplateImageryProvider({
            url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
            credit: '© Google Maps'
          });

          // 將Google Maps設為底圖
          viewer.imageryLayers.removeAll();
          const googleLayer = viewer.imageryLayers.addImageryProvider(googleMapsImageryProvider);

          // 調整圖像質量
          googleLayer.brightness = 1.0;
          googleLayer.contrast = 1.1;
          googleLayer.saturation = 1.2;

          // 2. 載入Minecraft風格建築 🎮
          const buildingsProvider = await Cesium.createOsmBuildingsAsync();

          // 應用 Minecraft 風格建築顏色 - 暫時使用單一隨機色
          // 由於 CesiumJS 3DTile 的限制，我們先使用單一但隨機的顏色
          const minecraftColors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
            '#FF7F50', '#98D8C8', '#F39C12', '#E74C3C', '#9B59B6', '#3498DB',
            '#2ECC71', '#F1C40F', '#E67E22', '#1ABC9C'
          ];

          const selectedColor = minecraftColors[Math.floor(Math.random() * minecraftColors.length)];
          buildingsProvider.style = new Cesium.Cesium3DTileStyle({
            color: `color('${selectedColor}')`
          });

          viewer.scene.primitives.add(buildingsProvider);

          console.log('✅ Minecraft風格建築載入成功');
          addMessage('success', '地圖樣式', '🎮 已載入Minecraft風格建築');

          // 添加環境光照效果，讓方塊更立體
          viewer.scene.globe.enableLighting = true;
          viewer.scene.light.intensity = 1.5;

          // 3. 啟用地形
          viewer.terrainProvider = await Cesium.createWorldTerrainAsync();

          addMessage('success', '地圖樣式', '🧱 已載入Google街道地圖 + Minecraft風格建築');
          console.log('✅ Google地圖載入成功');
        } catch (error) {
          console.error('❌ 立體建築載入失敗:', error);
          console.warn('⚠️ 立體建築載入失敗，使用預設地圖');
          addMessage('warning', '地圖樣式', '使用預設地圖');
        }
      };

      load3DFeatures();

      // 飛行到台北101 - 設定斜角視角
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(121.5645, 25.0340, 1000), // 1000米高度
        orientation: {
          heading: Cesium.Math.toRadians(45),  // 朝東北方向 (45度)
          pitch: Cesium.Math.toRadians(-25),   // 向下傾斜25度
          roll: 0.0
        }
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

          const currentTime = Date.now();
          const currentState = clickState();

          // 計算是否點擊在同一位置附近
          const latDiff = Math.abs(latitude - currentState.lastClickPosition.lat);
          const lngDiff = Math.abs(longitude - currentState.lastClickPosition.lng);
          const isSameLocation = latDiff < currentState.clickRadius && lngDiff < currentState.clickRadius;

          // 檢查是否是快速連續點擊（10秒內）
          const isQuickClick = (currentTime - currentState.lastClickTime) < 10000;

          // 調試日誌
          console.log(`🔍 調試信息:`);
          console.log(`  lastPosition:`, currentState.lastClickPosition);
          console.log(`  currentPosition:`, { lat: latitude, lng: longitude });
          console.log(`  latDiff: ${latDiff.toFixed(6)}, lngDiff: ${lngDiff.toFixed(6)}`);
          console.log(`  clickRadius: ${currentState.clickRadius}`);
          console.log(`  isSameLocation: ${isSameLocation}`);
          console.log(`  isQuickClick: ${isQuickClick} (timeDiff: ${currentTime - currentState.lastClickTime}ms)`);
          console.log(`  isFirstClick: ${currentState.isFirstClick}`);

          let newHeight: number;
          let newPitch: number;
          let message: string;

          if (currentState.isFirstClick || !isSameLocation || !isQuickClick) {
            // 第一階段：Zoom out 到表面上空獲得全景視野
            newHeight = 5000; // 5公里高度，俯瞰視角
            newPitch = Cesium.Math.toRadians(-60); // 60度俯角
            message = `🌍 第一階段 - 表面全景視野: ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;

            // 更新狀態為第二階段準備
            setClickState({
              lastClickPosition: { lat: latitude, lng: longitude },
              isFirstClick: false,
              clickRadius: currentState.clickRadius,
              lastClickTime: currentTime
            });

            // 飛行到點擊位置的俯瞰視角
            viewer!.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, newHeight),
              duration: 1.5,
              orientation: {
                heading: Cesium.Math.toRadians(0), // 朝北
                pitch: newPitch,
                roll: 0.0
              }
            });

          } else {
            // 第二階段：智能 Zoom in 進入近距離角度視角檢視
            // 先獲取地形高度，避免在山區時鑽入地表
            const cartographic = Cesium.Cartographic.fromDegrees(longitude, latitude);

            // 異步獲取地形高度
            const promise = Cesium.sampleTerrainMostDetailed(viewer!.terrainProvider, [cartographic]);
            promise.then((updatedPositions) => {
              const terrainHeight = updatedPositions[0].height || 0; // 地表高度（米）

              // 智能計算安全高度：地表高度 + 至少200米緩衝
              const safeHeight = Math.max(terrainHeight + 200, 200);

              // 如果是高山地區，增加更多緩衝
              if (terrainHeight > 1000) {
                newHeight = terrainHeight + 500; // 高山區域：地表 + 500米
                message = `🏔️ 第二階段 - 山區視角檢視 (地表+${(newHeight - terrainHeight).toFixed(0)}m): ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
              } else if (terrainHeight > 100) {
                newHeight = terrainHeight + 300; // 丘陵地區：地表 + 300米
                message = `🌄 第二階段 - 丘陵視角檢視 (地表+${(newHeight - terrainHeight).toFixed(0)}m): ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
              } else {
                newHeight = Math.max(terrainHeight + 200, 200); // 平地：地表 + 200米，最低200米
                message = `🔍 第二階段 - 角度視角檢視 (${newHeight.toFixed(0)}m): ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
              }

              newPitch = Cesium.Math.toRadians(-30); // 30度俯角

              // 重置狀態，為下次點擊做準備
              setClickState({
                lastClickPosition: { lat: 0, lng: 0 },
                isFirstClick: true,
                clickRadius: currentState.clickRadius,
                lastClickTime: currentTime
              });

              // 飛行到安全的近距離角度視角
              viewer!.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, newHeight),
                duration: 1.2,
                orientation: {
                  heading: Cesium.Math.toRadians(45), // 東北方向
                  pitch: newPitch,
                  roll: 0.0
                }
              });

              // 更新消息
              addMessage('info', '地圖導航', message);
            }).catch(() => {
              // 如果地形數據獲取失敗，使用安全的默認高度
              newHeight = 500; // 預設500米，比較安全
              message = `🔍 第二階段 - 安全視角檢視 (${newHeight}m): ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;

              setClickState({
                lastClickPosition: { lat: 0, lng: 0 },
                isFirstClick: true,
                clickRadius: currentState.clickRadius,
                lastClickTime: currentTime
              });

              viewer!.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, newHeight),
                duration: 1.2,
                orientation: {
                  heading: Cesium.Math.toRadians(45),
                  pitch: Cesium.Math.toRadians(-30),
                  roll: 0.0
                }
              });

              addMessage('info', '地圖導航', message);
            });

            // 提前顯示處理中的消息
            message = `🔄 正在計算安全高度...`;
          }

          // 添加點擊消息
          addMessage('info', '地圖導航', message);

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
      <div class="absolute top-4 left-4 bg-black/85 backdrop-blur text-white p-2 rounded-lg z-10 w-72 overflow-hidden">
        <div class="space-y-2">
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
            <div class="text-xs text-green-400 font-medium flex items-center justify-between">
              <span>即時位置監控</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  startLocationTracking();
                }}
                class="text-xs bg-green-500/20 hover:bg-green-500/30 px-2 py-0.5 rounded transition-colors cursor-pointer"
                disabled={userRealPosition().isTracking}
              >
                {userRealPosition().isTracking ? '追蹤中' : '📍取得'}
              </button>
            </div>

            {/* 緊湊的位置信息表格 */}
            <div class="bg-white/5 p-2 rounded space-y-1.5">
              {/* 相機視角 - 單行顯示 */}
              <div>
                <div class="text-xs text-blue-300 font-medium mb-0.5">視角</div>
                <div class="grid grid-cols-3 gap-1 text-xs font-mono">
                  <div class="bg-blue-500/10 p-1 rounded text-center">
                    <div class="text-blue-300 text-[10px]">緯</div>
                    <div>{currentPosition().latitude.toFixed(4)}°</div>
                  </div>
                  <div class="bg-blue-500/10 p-1 rounded text-center">
                    <div class="text-blue-300 text-[10px]">經</div>
                    <div>{currentPosition().longitude.toFixed(4)}°</div>
                  </div>
                  <div class="bg-blue-500/10 p-1 rounded text-center">
                    <div class="text-blue-300 text-[10px]">高</div>
                    <div>{(currentPosition().altitude / 1000).toFixed(1)}km</div>
                  </div>
                </div>
              </div>

              {/* 真實位置 - 緊湊顯示 */}
              <div class="border-t border-white/10 pt-1.5">
                <div class="text-xs text-orange-300 font-medium mb-0.5">GPS位置</div>
                {userRealPosition().error ? (
                  <div class="text-xs text-red-300 bg-red-500/10 p-1 rounded">
                    ❌ {userRealPosition().error.split('：')[0] || userRealPosition().error}
                  </div>
                ) : userRealPosition().latitude !== null ? (
                  <div class="grid grid-cols-3 gap-1 text-xs font-mono">
                    <div class="bg-orange-500/10 p-1 rounded text-center">
                      <div class="text-orange-300 text-[10px]">緯</div>
                      <div>{userRealPosition().latitude!.toFixed(4)}°</div>
                    </div>
                    <div class="bg-orange-500/10 p-1 rounded text-center">
                      <div class="text-orange-300 text-[10px]">經</div>
                      <div>{userRealPosition().longitude!.toFixed(4)}°</div>
                    </div>
                    <div class="bg-orange-500/10 p-1 rounded text-center">
                      <div class="text-orange-300 text-[10px]">精</div>
                      <div>±{userRealPosition().accuracy?.toFixed(0) || '?'}m</div>
                    </div>
                    {userRealPosition().timestamp && (
                      <div class="col-span-3 text-xs text-gray-400 text-center mt-0.5">
                        {userRealPosition().timestamp!.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div class="text-xs text-gray-400 bg-white/5 p-1 rounded text-center">
                    點擊上方按鈕
                  </div>
                )}
              </div>
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

          {/* 快速狀態欄 */}
          <div class="bg-white/5 p-2 rounded space-y-1">
            <div class="text-xs text-yellow-400 font-medium mb-1">狀態概覽</div>
            <div class="grid grid-cols-3 gap-1 text-xs">
              <div class="bg-blue-500/10 p-1 rounded text-center">
                <div class="text-blue-400">🏆</div>
                <div class="text-[10px]">等級1</div>
              </div>
              <div class="bg-emerald-500/10 p-1 rounded text-center">
                <div class="text-emerald-400">⭐</div>
                <div class="text-[10px]">積分0</div>
              </div>
              <div class="bg-purple-500/10 p-1 rounded text-center">
                <div class="text-purple-400">💎</div>
                <div class="text-[10px]">道具0</div>
              </div>
            </div>
            <div class="flex items-center justify-between bg-emerald-500/10 p-1 rounded mt-1">
              <div class="flex items-center space-x-1">
                <div class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <span class="text-[10px] text-emerald-300">系統運行</span>
              </div>
              <div class="flex space-x-0.5">
                <div class="w-0.5 h-2 bg-emerald-400 rounded"></div>
                <div class="w-0.5 h-2 bg-emerald-400 rounded"></div>
                <div class="w-0.5 h-2 bg-emerald-400 rounded"></div>
              </div>
            </div>
          </div>

          {/* 系統訊息 */}
          <div class="space-y-1 border-t border-white/20 pt-2">
            <div class="text-xs text-cyan-400 font-medium flex items-center justify-between">
              <span>系統訊息</span>
              <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
            <div
              ref={messageContainer!}
              class="bg-white/5 rounded space-y-1 p-2 max-h-24 overflow-y-auto scrollbar-dark"
            >
              <For each={messages().slice(0, 5)}>
                {(message) => (
                  <div class="flex items-start space-x-2 text-xs">
                    <div class={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${
                      message.type === 'success' ? 'bg-green-400' :
                      message.type === 'error' ? 'bg-red-400' :
                      message.type === 'warning' ? 'bg-yellow-400' :
                      'bg-blue-400'
                    }`}></div>
                    <div class="flex-1 min-w-0">
                      <div class={`font-medium ${
                        message.type === 'success' ? 'text-green-300' :
                        message.type === 'error' ? 'text-red-300' :
                        message.type === 'warning' ? 'text-yellow-300' :
                        'text-blue-300'
                      }`}>{message.title}</div>
                      <div class="text-gray-400 text-[10px] truncate">{message.content}</div>
                      <div class="text-gray-500 text-[9px]">{message.timestamp.toLocaleTimeString()}</div>
                    </div>
                  </div>
                )}
              </For>
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