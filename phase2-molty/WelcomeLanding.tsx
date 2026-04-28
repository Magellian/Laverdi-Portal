/**
 * WelcomeLanding.tsx
 * Phase 2 Integration: Updated Molty Animation with Icon Particles
 * - Uses new MoltyCharacter with orientation constraints
 * - Integrates IconParticleSystem for semantic particles
 * - 4x slower particle movement, 50% reduced count
 * - Maintains 60fps performance
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import MoltyCharacter from './MoltyCharacter';
import { ParticleSystem } from './ParticleSystem';
import { IconParticleSystem } from './IconParticle';

interface WelcomeLandingProps {
  onReadyClick?: () => void;
  autoSpawnParticles?: boolean;
}

const WelcomeLanding: React.FC<WelcomeLandingProps> = ({
  onReadyClick,
  autoSpawnParticles = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const moltyRef = useRef<MoltyCharacter | null>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const iconParticleSystemRef = useRef<IconParticleSystem | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfafafa);
    scene.fog = new THREE.Fog(0xfafafa, 100, 1000);
    sceneRef.current = scene;

    // Camera setup
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 2.5);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    // Create Molty character
    const molty = new MoltyCharacter({
      scale: 1.2,
      headRadius: 0.5,
      bodyHeight: 1.2,
      rotationSpeed: 0.08,
    });
    molty.position.set(0, -0.3, 0);
    scene.add(molty);
    moltyRef.current = molty;

    // Create particle system (optimized: 50% reduction, 4x slower)
    const particleSystem = new ParticleSystem({
      maxParticles: 30, // Reduced from 60
      spawnRate: 2,
      lifespan: 80,
      velocity: 0.015, // 4x slower
      opacityVariation: 0.3,
      colors: ['#FF3333', '#FF6666', '#CC0000'],
    });
    scene.add(particleSystem);
    particleSystemRef.current = particleSystem;

    // Create icon particle system
    const iconParticleSystem = new IconParticleSystem(40);
    scene.add(iconParticleSystem);
    iconParticleSystemRef.current = iconParticleSystem;

    // Auto-spawn particles
    if (autoSpawnParticles) {
      spawnIntervalRef.current = setInterval(() => {
        const burstChance = Math.random();
        if (burstChance < 0.3) {
          // Icon particle burst
          iconParticleSystem.spawnBurst(
            new THREE.Vector3(
              (Math.random() - 0.5) * 0.5,
              Math.random() * 0.3,
              0
            ),
            4
          );
        } else if (burstChance < 0.7) {
          // Generic particle burst
          particleSystem.spawnBurst(
            new THREE.Vector3(
              (Math.random() - 0.5) * 0.5,
              Math.random() * 0.3,
              0
            ),
            0.15,
            3
          );
        }
      }, 1500);
    }

    setIsReady(true);

    // Handle window resize
    const handleResize = () => {
      const newWidth = containerRef.current?.clientWidth || width;
      const newHeight = containerRef.current?.clientHeight || height;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    let lastFrameTime = Date.now();
    let frameCount = 0;

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      // Track FPS for performance monitoring
      const now = Date.now();
      frameCount++;
      if (now - lastFrameTime >= 1000) {
        console.log(`FPS: ${frameCount}`);
        frameCount = 0;
        lastFrameTime = now;
      }

      // Update Molty to face camera
      if (molty && camera) {
        molty.faceCamera(camera.position);
        molty.update();
      }

      // Update particles
      if (particleSystem) {
        particleSystem.update();
      }
      if (iconParticleSystem) {
        iconParticleSystem.update();
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
      }
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      particleSystem?.dispose();
      iconParticleSystem?.dispose();
      renderer.dispose();
    };
  }, [autoSpawnParticles]);

  const handleParticleSpawn = () => {
    if (moltyRef.current && iconParticleSystemRef.current) {
      iconParticleSystemRef.current.spawnBurst(
        moltyRef.current.position.clone().add(new THREE.Vector3(0, 0.3, 0)),
        6
      );
    }
  };

  const handleReady = () => {
    if (onReadyClick) {
      onReadyClick();
    }
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'linear-gradient(to right, #f5f5f5, #ffffff)' }}
      />

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 z-10">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-3">
            Welcome to <span className="text-red-600">Laverdi</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl">
            Intelligent property management, redefined. Meet Molty, your AI assistant.
          </p>
        </div>

        {/* Particle Spawn Button */}
        <button
          onClick={handleParticleSpawn}
          disabled={!isReady}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
        >
          Spawn Particles
        </button>

        {/* Ready Button */}
        <button
          onClick={handleReady}
          disabled={!isReady}
          className="px-8 py-4 bg-black text-white text-lg rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors duration-200"
        >
          Get Started
        </button>

        {/* Performance Monitor */}
        <div className="absolute bottom-8 right-8 text-sm text-gray-600 bg-white bg-opacity-80 px-4 py-2 rounded-lg">
          <p>Particles: {(particleSystemRef.current?.getParticleCount() || 0) + (iconParticleSystemRef.current?.getParticleCount() || 0)}</p>
          <p>Status: {isReady ? '✅ Ready' : '⏳ Loading'}</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeLanding;
