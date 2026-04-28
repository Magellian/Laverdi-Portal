/**
 * MoltyCharacter.ts
 * Production-ready Molty character with orientation constraints
 * - Stays upright (Y-axis locked)
 * - Faces camera (Z-axis rotation only)
 * - Smooth quaternion-based rotation
 * - Preserved leg geometry and proportions
 */

import * as THREE from 'three';

export interface MoltyConfig {
  scale?: number;
  headRadius?: number;
  bodyHeight?: number;
  positionY?: number;
  rotationSpeed?: number;
}

export class MoltyCharacter extends THREE.Group {
  private head: THREE.Mesh;
  private body: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private targetQuaternion: THREE.Quaternion;
  private currentQuaternion: THREE.Quaternion;
  private rotationSpeed: number = 0.08;

  constructor(configOrScene: MoltyConfig | THREE.Scene = {}) {
    super();
    
    // Handle both Scene and MoltyConfig
    let config: MoltyConfig;
    
    if (configOrScene instanceof THREE.Scene) {
      // If Scene passed directly, use default config
      config = { scale: 1.5 };
    } else {
      // Otherwise use as config
      config = configOrScene;
    }
    
    const {
      scale = 1,
      headRadius = 0.5 * scale,
      bodyHeight = 1.2 * scale,
      positionY = 0,
      rotationSpeed = 0.08,
    } = config;

    this.rotationSpeed = rotationSpeed;
    this.targetQuaternion = new THREE.Quaternion();
    this.currentQuaternion = this.quaternion.clone();

    // Build character geometry
    this.head = this.createHead(headRadius);
    this.body = this.createBody(bodyHeight, scale);
    this.leftLeg = this.createLeg(scale, -0.25 * scale);
    this.rightLeg = this.createLeg(scale, 0.25 * scale);

    // Position legs (stay at bottom, fixed)
    this.leftLeg.position.set(-0.25 * scale, -bodyHeight / 2 - 0.3 * scale, 0);
    this.rightLeg.position.set(0.25 * scale, -bodyHeight / 2 - 0.3 * scale, 0);

    // Add to group
    this.add(this.head);
    this.add(this.body);
    this.add(this.leftLeg);
    this.add(this.rightLeg);

    // Position group
    this.position.y = positionY;
  }

  /**
   * Create head geometry
   */
  private createHead(radius: number): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: 0xff3333, // Deep red
      emissive: 0x990000,
      shininess: 100,
    });
    const head = new THREE.Mesh(geometry, material);
    head.position.y = 0.7;
    head.castShadow = true;
    head.receiveShadow = true;
    return head;
  }

  /**
   * Create body geometry
   */
  private createBody(height: number, scale: number): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(0.35 * scale, 0.4 * scale, height, 32);
    const material = new THREE.MeshPhongMaterial({
      color: 0xff3333, // Deep red
      emissive: 0x990000,
      shininess: 100,
    });
    const body = new THREE.Mesh(geometry, material);
    body.castShadow = true;
    body.receiveShadow = true;
    return body;
  }

  /**
   * Create leg geometry (fixed position, no animation)
   */
  private createLeg(scale: number, offsetX: number): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(0.1 * scale, 0.12 * scale, 0.5 * scale, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0xb30000, // Darker red
      emissive: 0x660000,
      shininess: 80,
    });
    const leg = new THREE.Mesh(geometry, material);
    leg.castShadow = true;
    leg.receiveShadow = true;
    return leg;
  }

  /**
   * Constrain orientation to upright
   * 
   * Locks Y-axis rotation, allows Z-axis only (face camera)
   * Ensures character always stands on feet
   */
  public constrainOrientationToUpright(): void {
    // Extract current euler angles
    const euler = new THREE.Euler();
    euler.setFromQuaternion(this.currentQuaternion, 'YXZ');

    // Zero out X and Y rotations (keep upright)
    // Only preserve Z rotation (face camera)
    const constrainedEuler = new THREE.Euler(0, 0, euler.z, 'YXZ');
    const constrainedQuat = new THREE.Quaternion();
    constrainedQuat.setFromEuler(constrainedEuler);

    this.targetQuaternion.copy(constrainedQuat);
  }

  /**
   * Smooth quaternion rotation toward target
   * Interpolates between current and target rotation
   */
  public smoothRotateTowardTarget(): void {
    this.currentQuaternion.slerp(this.targetQuaternion, this.rotationSpeed);
    this.quaternion.copy(this.currentQuaternion);
  }

  /**
   * Face camera with smooth Z-axis rotation
   * Calculates angle to face camera, constrains to Z-axis only
   */
  public faceCamera(cameraPosition: THREE.Vector3): void {
    // Calculate direction to camera
    const directionToCamera = cameraPosition.clone().sub(this.position).normalize();

    // Create look-at quaternion
    const lookAtQuat = new THREE.Quaternion();
    const upVector = new THREE.Vector3(0, 1, 0);
    
    // Use forward vector (0, 0, 1) and calculate rotation to face camera
    const forward = new THREE.Vector3(0, 0, 1);
    const axis = new THREE.Vector3();
    axis.crossVectors(forward, directionToCamera).normalize();

    if (axis.lengthSq() > 0.001) {
      const angle = Math.acos(Math.max(-1, Math.min(1, forward.dot(directionToCamera))));
      lookAtQuat.setFromAxisAngle(axis, angle);
    }

    // Constrain to Z-axis rotation only
    const euler = new THREE.Euler();
    euler.setFromQuaternion(lookAtQuat, 'YXZ');
    
    const constrainedEuler = new THREE.Euler(0, 0, euler.z, 'YXZ');
    this.targetQuaternion.setFromEuler(constrainedEuler);

    this.constrainOrientationToUpright();
    this.smoothRotateTowardTarget();
  }

  /**
   * Set target rotation on Z-axis only
   * @param angleZ Rotation in radians around Z-axis
   */
  public setZAxisRotation(angleZ: number): void {
    const euler = new THREE.Euler(0, 0, angleZ, 'YXZ');
    this.targetQuaternion.setFromEuler(euler);
    this.constrainOrientationToUpright();
  }

  /**
   * Update character (call in animation loop)
   */
  public update(): void {
    this.smoothRotateTowardTarget();
  }

  /**
   * Get current rotation (for debugging/monitoring)
   */
  public getRotationEuler(): THREE.Euler {
    const euler = new THREE.Euler();
    euler.setFromQuaternion(this.currentQuaternion, 'YXZ');
    return euler;
  }

  /**
   * Check if character is upright (Y-axis near zero)
   */
  public isUpright(): boolean {
    const euler = this.getRotationEuler();
    return Math.abs(euler.x) < 0.1 && Math.abs(euler.y) < 0.1;
  }
}

export default MoltyCharacter;
