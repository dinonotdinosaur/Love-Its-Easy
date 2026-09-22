"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

function createHeartGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0.25, 0.25);
  shape.bezierCurveTo(0.25, 0.25, 0.2, 0, 0, 0);
  shape.bezierCurveTo(-0.3, 0, -0.3, 0.35, -0.3, 0.35);
  shape.bezierCurveTo(-0.3, 0.55, -0.1, 0.77, 0.25, 0.95);
  shape.bezierCurveTo(0.6, 0.77, 0.8, 0.55, 0.8, 0.35);
  shape.bezierCurveTo(0.8, 0.35, 0.8, 0, 0.5, 0);
  shape.bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2,
  });
  geometry.center();
  geometry.scale(0.7, 0.7, 0.7);
  geometry.rotateZ(Math.PI);
  return geometry;
}

/** Плавающий фон из 3D-сердец — грузится только через dynamic import (см. index.tsx). */
export default function HeartsBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const point = new THREE.PointLight(0xffffff, 1.2);
    point.position.set(2, 2, 5);
    scene.add(point);

    const geometry = createHeartGeometry();
    const material = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.4,
      metalness: 0.1,
    });

    const hearts = Array.from({ length: 16 }, () => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8 - 4,
        (Math.random() - 0.5) * 4,
      );
      mesh.scale.setScalar(0.4 + Math.random() * 0.6);
      scene.add(mesh);
      return { mesh, speed: 0.006 + Math.random() * 0.01, rotSpeed: (Math.random() - 0.5) * 0.01 };
    });

    let frameId: number;
    function animate() {
      for (const heart of hearts) {
        heart.mesh.position.y += heart.speed;
        heart.mesh.rotation.y += heart.rotSpeed;
        if (heart.mesh.position.y > 5) heart.mesh.position.y = -5;
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }
    animate();

    function handleResize() {
      camera.aspect = container!.clientWidth / container!.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container!.clientWidth, container!.clientHeight);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" aria-hidden />;
}
