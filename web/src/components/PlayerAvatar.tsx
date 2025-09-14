import { onMount, createSignal } from 'solid-js';
import * as THREE from 'three';
import * as Cesium from 'cesium';

export interface PlayerAvatarProps {
  playerId: string;
  position: {
    latitude: number;
    longitude: number;
    height?: number;
  };
  viewer: Cesium.Viewer;
  name?: string;
  color?: string;
}

export function createPlayerAvatar(props: PlayerAvatarProps) {
  let threeGroup: THREE.Group;
  let cesiumEntity: Cesium.Entity;

  // 創建 Three.js 玩偶幾何體
  const createAvatarGeometry = () => {
    const group = new THREE.Group();

    // 身體 (圓柱體)
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.0, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: props.color || '#4A90E2'
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0;
    group.add(body);

    // 頭部 (球體)
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const headMaterial = new THREE.MeshLambertMaterial({
      color: '#FDBCB4'
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.75;
    group.add(head);

    // 手臂 (左右)
    const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 6);
    const armMaterial = new THREE.MeshLambertMaterial({
      color: '#FDBCB4'
    });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.4, 0.2, 0);
    leftArm.rotation.z = Math.PI / 6;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.4, 0.2, 0);
    rightArm.rotation.z = -Math.PI / 6;
    group.add(rightArm);

    // 腿部 (左右)
    const legGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6);
    const legMaterial = new THREE.MeshLambertMaterial({
      color: '#2C3E50'
    });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, -0.9, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, -0.9, 0);
    group.add(rightLeg);

    // 名稱標籤 (使用 Canvas texture)
    if (props.name) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const context = canvas.getContext('2d')!;

      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = 'white';
      context.font = '24px Arial';
      context.textAlign = 'center';
      context.fillText(props.name, canvas.width / 2, canvas.height / 2 + 8);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.y = 1.5;
      sprite.scale.set(2, 0.5, 1);
      group.add(sprite);
    }

    // 縮放整個玩偶
    group.scale.set(3, 3, 3);

    return group;
  };

  // 添加玩偶到 Cesium 場景
  const addToCesium = () => {
    threeGroup = createAvatarGeometry();

    // 計算位置
    const position = Cesium.Cartesian3.fromDegrees(
      props.position.longitude,
      props.position.latitude,
      props.position.height || 0
    );

    // 創建 Cesium entity
    cesiumEntity = props.viewer.entities.add({
      id: `player-${props.playerId}`,
      position: position,
      orientation: Cesium.Transforms.headingPitchRollQuaternion(
        position,
        new Cesium.HeadingPitchRoll(0, 0, 0)
      ),
    });

    // 使用 Cesium 的 3D Tiles 風格添加 Three.js 物體
    const primitive = new Cesium.Primitive({
      geometryInstances: [],
      appearance: new Cesium.MaterialAppearance()
    });

    // 添加到場景中
    props.viewer.scene.primitives.add(primitive);
  };

  // 更新玩偶位置
  const updatePosition = (newPosition: typeof props.position) => {
    if (cesiumEntity) {
      const cartesian = Cesium.Cartesian3.fromDegrees(
        newPosition.longitude,
        newPosition.latitude,
        newPosition.height || 0
      );
      cesiumEntity.position = cartesian;
    }
  };

  // 移除玩偶
  const remove = () => {
    if (cesiumEntity) {
      props.viewer.entities.remove(cesiumEntity);
    }
  };

  // 播放動畫 (走路動畫)
  const playWalkAnimation = () => {
    if (threeGroup) {
      const legs = threeGroup.children.filter((child, index) =>
        index === 4 || index === 5 // 腿部
      );

      legs.forEach((leg, index) => {
        const startRotation = leg.rotation.x;
        const targetRotation = startRotation + (index === 0 ? 0.3 : -0.3);

        // 簡單的來回擺動動畫
        const animate = () => {
          leg.rotation.x = startRotation + Math.sin(Date.now() * 0.005) * 0.3;
          requestAnimationFrame(animate);
        };
        animate();
      });
    }
  };

  return {
    add: addToCesium,
    updatePosition,
    remove,
    playWalkAnimation,
    entity: () => cesiumEntity,
    threeObject: () => threeGroup
  };
}

// 玩偶管理器
export class PlayerAvatarManager {
  private viewer: Cesium.Viewer;
  private avatars: Map<string, ReturnType<typeof createPlayerAvatar>> = new Map();

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  // 添加玩偶
  addPlayer(playerId: string, position: PlayerAvatarProps['position'], name?: string, color?: string) {
    // 如果玩偶已存在，先移除
    if (this.avatars.has(playerId)) {
      this.removePlayer(playerId);
    }

    const avatar = createPlayerAvatar({
      playerId,
      position,
      viewer: this.viewer,
      name,
      color
    });

    avatar.add();
    this.avatars.set(playerId, avatar);

    return avatar;
  }

  // 更新玩偶位置
  updatePlayerPosition(playerId: string, position: PlayerAvatarProps['position']) {
    const avatar = this.avatars.get(playerId);
    if (avatar) {
      avatar.updatePosition(position);
      avatar.playWalkAnimation();
    }
  }

  // 移除玩偶
  removePlayer(playerId: string) {
    const avatar = this.avatars.get(playerId);
    if (avatar) {
      avatar.remove();
      this.avatars.delete(playerId);
    }
  }

  // 獲取玩偶
  getPlayer(playerId: string) {
    return this.avatars.get(playerId);
  }

  // 獲取所有玩偶
  getAllPlayers() {
    return Array.from(this.avatars.entries());
  }

  // 清理所有玩偶
  clear() {
    this.avatars.forEach(avatar => avatar.remove());
    this.avatars.clear();
  }
}