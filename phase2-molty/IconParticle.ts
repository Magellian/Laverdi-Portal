/**
 * IconParticle.ts
 * Semantic icon particles with SVG rendering
 * - 6 icon types: email, checkmark, gear, document, link, clock
 * - SVG-based 3D rendering
 * - Float/rotate animations
 * - Color variations (primary red)
 * - Size variations
 * - Opacity fade
 */

import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

export enum IconType {
  EMAIL = 'email',
  CHECKMARK = 'checkmark',
  GEAR = 'gear',
  DOCUMENT = 'document',
  LINK = 'link',
  CLOCK = 'clock',
}

export interface IconParticleConfig {
  iconType: IconType;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  size?: number;
  color?: string;
  opacity?: number;
}

export class IconParticle extends THREE.Group {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public acceleration: THREE.Vector3;
  public life: number;
  public maxLife: number;
  private mesh: THREE.Mesh | THREE.Group;
  private iconType: IconType;
  private initialOpacity: number;
  private initialScale: number;
  private rotationSpeed: THREE.Vector3;

  constructor(config: IconParticleConfig) {
    super();

    const {
      iconType,
      position,
      velocity,
      life,
      size = 0.15,
      color = '#FF3333',
      opacity = 0.8,
    } = config;

    this.position = position.clone();
    this.velocity = velocity.clone();
    this.acceleration = new THREE.Vector3(0, 0.015, 0); // Gentle upward float
    this.life = life;
    this.maxLife = life;
    this.iconType = iconType;
    this.initialOpacity = opacity;
    this.initialScale = size;

    // Random rotation speeds for each axis
    this.rotationSpeed = new THREE.Vector3(
      (Math.random() - 0.5) * 0.03,
      (Math.random() - 0.5) * 0.04,
      (Math.random() - 0.5) * 0.03
    );

    // Create icon mesh
    this.mesh = this.createIconMesh(iconType, size, color);
    this.add(this.mesh);

    // Set initial position
    super.position.copy(position);
  }

  /**
   * Create icon mesh based on type
   * Generates simple geometric representations of icons
   */
  private createIconMesh(iconType: IconType, size: number, color: string): THREE.Mesh {
    let geometry: THREE.BufferGeometry;

    switch (iconType) {
      case IconType.EMAIL:
        geometry = this.createEmailGeometry(size);
        break;
      case IconType.CHECKMARK:
        geometry = this.createCheckmarkGeometry(size);
        break;
      case IconType.GEAR:
        geometry = this.createGearGeometry(size);
        break;
      case IconType.DOCUMENT:
        geometry = this.createDocumentGeometry(size);
        break;
      case IconType.LINK:
        geometry = this.createLinkGeometry(size);
        break;
      case IconType.CLOCK:
        geometry = this.createClockGeometry(size);
        break;
      default:
        geometry = new THREE.BoxGeometry(size, size, size);
    }

    const material = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
      wireframe: false,
      transparent: true,
      opacity: this.initialOpacity,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Create email envelope geometry
   */
  private createEmailGeometry(size: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -size, -size, 0, // 0 - bottom left
      size, -size, 0,  // 1 - bottom right
      size, size, 0,   // 2 - top right
      -size, size, 0,  // 3 - top left
      0, 0, size * 0.5, // 4 - center point
    ]);

    const indices = new Uint16Array([
      // Front
      0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4,
      // Back rectangle
      0, 3, 2, 0, 2, 1,
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    return geometry;
  }

  /**
   * Create checkmark geometry
   */
  private createCheckmarkGeometry(size: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const s = size * 0.5;
    
    const vertices = new Float32Array([
      -s, 0, 0,
      -s * 0.2, -s * 0.5, 0,
      s * 0.5, s * 0.8, 0,
      s, s * 0.3, 0,
    ]);

    const indices = new Uint16Array([0, 1, 2, 2, 3, 0]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    return geometry;
  }

  /**
   * Create gear geometry
   */
  private createGearGeometry(size: number): THREE.BufferGeometry {
    const geometry = new THREE.CylinderGeometry(size, size, size * 0.3, 8);
    return geometry;
  }

  /**
   * Create document geometry
   */
  private createDocumentGeometry(size: number): THREE.BufferGeometry {
    const geometry = new THREE.BoxGeometry(size * 0.6, size, size * 0.1);
    return geometry;
  }

  /**
   * Create link/chain geometry
   */
  private createLinkGeometry(size: number): THREE.BufferGeometry {
    const geometry = new THREE.TorusGeometry(size * 0.3, size * 0.1, 8, 16);
    return geometry;
  }

  /**
   * Create clock geometry
   */
  private createClockGeometry(size: number): THREE.BufferGeometry {
    const geometry = new THREE.CylinderGeometry(size, size, size * 0.2, 32);
    return geometry;
  }

  /**
   * Update particle physics and animation
   * Returns true if particle is still alive
   */
  public update(): boolean {
    this.life--;

    // Update velocity with acceleration
    this.velocity.add(this.acceleration);

    // Apply slight drag
    this.velocity.multiplyScalar(0.98);

    // Update position
    this.position.add(this.velocity);
    super.position.copy(this.position);

    // Update rotation
    this.rotation.x += this.rotationSpeed.x;
    this.rotation.y += this.rotationSpeed.y;
    this.rotation.z += this.rotationSpeed.z;

    // Fade out and shrink at end of life
    const progress = this.life / this.maxLife;
    const material = (this.mesh as THREE.Mesh).material as THREE.MeshPhongMaterial;
    material.opacity = this.initialOpacity * Math.max(0, progress);

    // Scale down as life ends
    const scale = this.initialScale * Math.max(0.3, progress);
    this.scale.set(scale, scale, scale);

    return this.life > 0;
  }

  /**
   * Get remaining life percentage (0-1)
   */
  public getLifeProgress(): number {
    return Math.max(0, this.life / this.maxLife);
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    if (this.mesh instanceof THREE.Mesh) {
      (this.mesh.geometry as THREE.BufferGeometry).dispose();
      (this.mesh.material as THREE.MeshPhongMaterial).dispose();
    }
  }
}

/**
 * Icon Particle System Manager
 * Handles spawning, updating, and cleanup of icon particles
 */
export class IconParticleSystem extends THREE.Group {
  private particles: IconParticle[] = [];
  private maxParticles: number;
  private iconTypes: IconType[] = [
    IconType.EMAIL,
    IconType.CHECKMARK,
    IconType.GEAR,
    IconType.DOCUMENT,
    IconType.LINK,
    IconType.CLOCK,
  ];

  constructor(maxParticles: number = 40) {
    super();
    this.maxParticles = maxParticles;
  }

  /**
   * Spawn an icon particle
   */
  public spawn(
    position: THREE.Vector3,
    velocity?: THREE.Vector3,
    iconType?: IconType
  ): IconParticle | null {
    if (this.particles.length >= this.maxParticles) {
      return null;
    }

    const type = iconType || this.iconTypes[Math.floor(Math.random() * this.iconTypes.length)];
    const vel = velocity || new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      Math.random() * 0.02 + 0.01,
      (Math.random() - 0.5) * 0.02
    );

    const particle = new IconParticle({
      iconType: type,
      position,
      velocity: vel,
      life: 120,
      size: 0.12 + Math.random() * 0.08,
      color: '#FF3333',
      opacity: 0.75 + Math.random() * 0.25,
    });

    this.add(particle);
    this.particles.push(particle);

    return particle;
  }

  /**
   * Spawn multiple particles at once
   */
  public spawnBurst(position: THREE.Vector3, count: number = 6): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 0.015 + Math.random() * 0.01;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.random() * 0.01 + 0.005,
        Math.sin(angle) * speed
      );

      this.spawn(position, velocity);
    }
  }

  /**
   * Update all particles
   */
  public update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      if (!particle.update()) {
        this.remove(particle);
        particle.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Get active particle count
   */
  public getParticleCount(): number {
    return this.particles.length;
  }

  /**
   * Clear all particles
   */
  public clear(): void {
    this.particles.forEach((p) => {
      this.remove(p);
      p.dispose();
    });
    this.particles = [];
  }

  /**
   * Dispose system
   */
  public dispose(): void {
    this.clear();
  }
}

export default IconParticle;
