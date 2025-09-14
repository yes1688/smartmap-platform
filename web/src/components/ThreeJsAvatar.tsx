import * as THREE from 'three';
import * as Cesium from 'cesium';

export interface ThreeJsAvatarProps {
  playerId: string;
  position: {
    latitude: number;
    longitude: number;
    height?: number;
  };
  viewer: Cesium.Viewer;
  name?: string;
  color?: string;
  isCurrentPlayer?: boolean;
}

// Three.js 玩偶創建器
export function createThreeJsAvatar(props: ThreeJsAvatarProps) {
  // 檢查 Three.js 是否載入
  if (typeof THREE === 'undefined') {
    console.error('❌ Three.js 未載入！無法創建 3D 玩偶');
    return null;
  }

  console.log('✅ Three.js 已載入，版本:', THREE.REVISION);

  const scene = new THREE.Scene();
  const group = new THREE.Group();

  // 材質定義
  const skinMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB5 }); // 膚色
  const shirtMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color(props.color || '#4ECDC4')
  });
  const pantsMaterial = new THREE.MeshLambertMaterial({ color: 0x2C3E50 }); // 深色褲子
  const shoeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // 棕色鞋子

  // 🐰 Three.js 兔子模型
  // 主要顏色
  const rabbitColor = new THREE.Color(props.color || '#FFF8DC'); // 米白色
  const pinkColor = new THREE.Color('#FFB6C1'); // 粉紅色
  const blackColor = new THREE.Color('#000000'); // 黑色

  const rabbitMaterial = new THREE.MeshLambertMaterial({ color: rabbitColor });
  const pinkMaterial = new THREE.MeshLambertMaterial({ color: pinkColor });
  const blackMaterial = new THREE.MeshLambertMaterial({ color: blackColor });

  // 1. 兔子身體 - 橢圓體
  const bodyGeometry = new THREE.SphereGeometry(0.8, 16, 16);
  bodyGeometry.scale(1, 1.2, 0.8); // 稍微拉長
  const body = new THREE.Mesh(bodyGeometry, rabbitMaterial);
  body.position.set(0, 0, 0);
  group.add(body);

  // 2. 兔子頭 - 橢圓體
  const headGeometry = new THREE.SphereGeometry(0.6, 16, 16);
  headGeometry.scale(0.9, 1, 1); // 稍微壓扁
  const head = new THREE.Mesh(headGeometry, rabbitMaterial);
  head.position.set(0, 1.3, 0.2);
  group.add(head);

  // 3. 長耳朵
  const earGeometry = new THREE.SphereGeometry(0.15, 8, 16);
  earGeometry.scale(0.6, 2.5, 0.4); // 拉長成耳朵形狀

  const leftEar = new THREE.Mesh(earGeometry, rabbitMaterial);
  leftEar.position.set(-0.25, 2.1, 0.1);
  leftEar.rotation.z = 0.3;
  group.add(leftEar);

  const rightEar = new THREE.Mesh(earGeometry, rabbitMaterial);
  rightEar.position.set(0.25, 2.1, 0.1);
  rightEar.rotation.z = -0.3;
  group.add(rightEar);

  // 4. 耳朵內側 (粉紅色)
  const innerEarGeometry = new THREE.SphereGeometry(0.08, 6, 12);
  innerEarGeometry.scale(0.5, 1.8, 0.3);

  const leftInnerEar = new THREE.Mesh(innerEarGeometry, pinkMaterial);
  leftInnerEar.position.set(-0.22, 2.0, 0.15);
  leftInnerEar.rotation.z = 0.3;
  group.add(leftInnerEar);

  const rightInnerEar = new THREE.Mesh(innerEarGeometry, pinkMaterial);
  rightInnerEar.position.set(0.22, 2.0, 0.15);
  rightInnerEar.rotation.z = -0.3;
  group.add(rightInnerEar);

  // 5. 眼睛
  const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);

  const leftEye = new THREE.Mesh(eyeGeometry, blackMaterial);
  leftEye.position.set(-0.15, 1.4, 0.5);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, blackMaterial);
  rightEye.position.set(0.15, 1.4, 0.5);
  group.add(rightEye);

  // 6. 鼻子 (粉紅色小三角)
  const noseGeometry = new THREE.SphereGeometry(0.04, 6, 6);
  const nose = new THREE.Mesh(noseGeometry, pinkMaterial);
  nose.position.set(0, 1.25, 0.55);
  group.add(nose);

  // 7. 前腳
  const frontPawGeometry = new THREE.SphereGeometry(0.2, 8, 8);
  frontPawGeometry.scale(0.7, 1.5, 0.7);

  const leftFrontPaw = new THREE.Mesh(frontPawGeometry, rabbitMaterial);
  leftFrontPaw.position.set(-0.4, -0.5, 0.4);
  group.add(leftFrontPaw);

  const rightFrontPaw = new THREE.Mesh(frontPawGeometry, rabbitMaterial);
  rightFrontPaw.position.set(0.4, -0.5, 0.4);
  group.add(rightFrontPaw);

  // 8. 後腳 (更大更長)
  const backPawGeometry = new THREE.SphereGeometry(0.25, 8, 8);
  backPawGeometry.scale(0.8, 1.2, 1.8);

  const leftBackPaw = new THREE.Mesh(backPawGeometry, rabbitMaterial);
  leftBackPaw.position.set(-0.35, -0.7, -0.2);
  group.add(leftBackPaw);

  const rightBackPaw = new THREE.Mesh(backPawGeometry, rabbitMaterial);
  rightBackPaw.position.set(0.35, -0.7, -0.2);
  group.add(rightBackPaw);

  // 9. 尾巴 (小毛球)
  const tailGeometry = new THREE.SphereGeometry(0.12, 8, 8);
  const tail = new THREE.Mesh(tailGeometry, rabbitMaterial);
  tail.position.set(0, 0.2, -0.7);
  group.add(tail);

  // 10. 當前玩家標記 - 胡蘿蔔帽子！
  if (props.isCurrentPlayer) {
    // 胡蘿蔔身體
    const carrotGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
    const carrotMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 }); // 橘紅色
    const carrot = new THREE.Mesh(carrotGeometry, carrotMaterial);
    carrot.position.set(0, 2.8, 0);
    carrot.rotation.x = Math.PI; // 翻轉讓尖端向上
    group.add(carrot);

    // 胡蘿蔔葉子
    const leafGeometry = new THREE.ConeGeometry(0.1, 0.3, 4);
    const leafMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // 綠色

    for (let i = 0; i < 3; i++) {
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      leaf.position.set(
        Math.cos(i * 2 * Math.PI / 3) * 0.15,
        3.1,
        Math.sin(i * 2 * Math.PI / 3) * 0.15
      );
      leaf.rotation.x = Math.PI;
      group.add(leaf);
    }
  }

  // 添加環境光和方向光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 5);
  scene.add(directionalLight);

  // 將玩偶組加入場景
  scene.add(group);

  // 縮放兔子玩偶到正常尺寸
  group.scale.set(1.2, 1.2, 1.2);

  // 創建渲染器
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true
  });
  renderer.setSize(160, 200); // 正常渲染尺寸
  renderer.setClearColor(0x000000, 0); // 透明背景

  // 設置相機
  const camera = new THREE.PerspectiveCamera(45, 0.75, 0.1, 1000); // 調整寬高比為 3:4
  camera.position.set(0, 1, 10); // 往後拉遠一點，並降低高度
  camera.lookAt(0, 1, 0); // 看向兔子中心位置

  // 渲染場景
  renderer.render(scene, camera);

  // 獲取渲染結果作為 Data URL
  const dataURL = renderer.domElement.toDataURL('image/png');

  // 返回玩偶數據和清理函數
  return {
    group,
    scene,
    renderer,
    camera,
    dataURL,
    dispose: () => {
      // 清理 Three.js 資源
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
    },
    updateColor: (newColor: string) => {
      // 更新兔子顏色
      const newRabbitMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color(newColor)
      });
      body.material = newRabbitMaterial;
      head.material = newRabbitMaterial;
      leftEar.material = newRabbitMaterial;
      rightEar.material = newRabbitMaterial;
      leftFrontPaw.material = newRabbitMaterial;
      rightFrontPaw.material = newRabbitMaterial;
      leftBackPaw.material = newRabbitMaterial;
      rightBackPaw.material = newRabbitMaterial;
      tail.material = newRabbitMaterial;

      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/png');
    },
    animate: () => {
      // 🐰 可愛的兔子跳躍動畫
      const time = Date.now() * 0.008;

      // 整體上下跳躍
      group.position.y = Math.abs(Math.sin(time)) * 0.3;

      // 耳朵擺動
      leftEar.rotation.x = Math.sin(time * 1.2) * 0.2;
      rightEar.rotation.x = Math.sin(time * 1.2 + 0.3) * 0.2;

      // 前腳輕微擺動
      leftFrontPaw.rotation.x = Math.sin(time * 2) * 0.1;
      rightFrontPaw.rotation.x = -Math.sin(time * 2) * 0.1;

      // 後腳準備跳躍的動作
      leftBackPaw.rotation.x = Math.sin(time) * 0.15;
      rightBackPaw.rotation.x = Math.sin(time) * 0.15;

      // 尾巴搖擺
      tail.rotation.y = Math.sin(time * 3) * 0.3;

      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/png');
    }
  };
}

// 在 Cesium 中使用 Three.js 玩偶的工具函數
export function addThreeJsAvatarToCesium(
  viewer: Cesium.Viewer,
  avatarProps: ThreeJsAvatarProps
) {
  // 創建 Three.js 兔子玩偶
  const threeAvatar = createThreeJsAvatar(avatarProps);

  if (!threeAvatar) {
    console.error('❌ 無法創建 Three.js 兔子玩偶');
    return null;
  }

  console.log('🐰 Three.js 兔子玩偶創建成功！');

  // 將 Three.js 渲染結果轉換為 Cesium Billboard
  const position = Cesium.Cartesian3.fromDegrees(
    avatarProps.position.longitude,
    avatarProps.position.latitude,
    (avatarProps.position.height || 0) + 2 // 稍微提高以避免埋在地下
  );

  // 使用 Three.js 渲染的兔子圖像作為 Billboard
  const entity = viewer.entities.add({
    id: `threejs-avatar-${avatarProps.playerId}`,
    position: position,
    // 使用 Three.js 渲染的圖像
    billboard: {
      image: threeAvatar.dataURL,
      width: 80, // 正常寬度
      height: 120, // 正常高度
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
      scale: 1.0, // 正常顯示尺寸
      disableDepthTestDistance: Number.POSITIVE_INFINITY // 確保始終可見
    },
    label: {
      text: `🐰 ${avatarProps.name || avatarProps.playerId}`,
      font: '16px Arial Bold',
      fillColor: avatarProps.isCurrentPlayer ? Cesium.Color.YELLOW : Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, -60), // 標籤在兔子上方
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
    },
    properties: {
      playerId: avatarProps.playerId,
      playerName: avatarProps.name,
      isCurrentPlayer: avatarProps.isCurrentPlayer || false,
      avatarType: 'rabbit'
    }
  });

  // 如果是當前玩家，添加脈衝效果
  if (avatarProps.isCurrentPlayer) {
    viewer.entities.add({
      id: `pulse-${avatarProps.playerId}`,
      position: position,
      ellipse: {
        semiMajorAxis: 5.0,
        semiMinorAxis: 5.0,
        material: new Cesium.ColorMaterialProperty(
          Cesium.Color.YELLOW.withAlpha(0.3)
        ),
        outline: true,
        outlineColor: Cesium.Color.YELLOW,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    });
  }

  return {
    entity,
    threeAvatar,
    updatePosition: (newPosition: { latitude: number; longitude: number; height?: number }) => {
      const newCartesian = Cesium.Cartesian3.fromDegrees(
        newPosition.longitude,
        newPosition.latitude,
        newPosition.height || 0
      );
      entity.position = newCartesian;

      // 更新脈衝位置
      if (avatarProps.isCurrentPlayer) {
        const pulseEntity = viewer.entities.getById(`pulse-${avatarProps.playerId}`);
        if (pulseEntity) {
          pulseEntity.position = newCartesian;
        }
      }
    },
    startWalkingAnimation: () => {
      console.log('🐰 開始兔子跳躍動畫！');
      const animateFrame = () => {
        if (threeAvatar && threeAvatar.animate) {
          const newDataURL = threeAvatar.animate();
          if (entity.billboard) {
            entity.billboard.image = new Cesium.ConstantProperty(newDataURL);
          }
        }
        requestAnimationFrame(animateFrame);
      };
      animateFrame();
    },
    dispose: () => {
      viewer.entities.remove(entity);
      if (avatarProps.isCurrentPlayer) {
        const pulseEntity = viewer.entities.getById(`pulse-${avatarProps.playerId}`);
        if (pulseEntity) {
          viewer.entities.remove(pulseEntity);
        }
      }
      threeAvatar.dispose();
    }
  };
}