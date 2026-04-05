import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function NeuralBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 6;

    // Nodes
    const nodeCount = 60;
    const nodePositions = [];
    const nodeGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x0891b2 });

    const instancedMesh = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, nodeCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < nodeCount; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6
      );
      nodePositions.push(pos);
      dummy.position.copy(pos);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(instancedMesh);

    // Lines connecting nearby nodes
    const linePositions = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dist = nodePositions[i].distanceTo(nodePositions[j]);
        if (dist < 3.5) {
          linePositions.push(
            nodePositions[i].x, nodePositions[i].y, nodePositions[i].z,
            nodePositions[j].x, nodePositions[j].y, nodePositions[j].z,
          );
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x0891b2,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // Floating ambient particles
    const particleCount = 300;
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 20;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 0.015,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    const handleMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5);
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    let t = 0;
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      t += 0.004;

      scene.rotation.y += (mouseRef.current.x * 0.3 - scene.rotation.y) * 0.05;
      scene.rotation.x += (mouseRef.current.y * 0.2 - scene.rotation.x) * 0.05;

      particles.rotation.y = t * 0.05;
      particles.rotation.x = t * 0.02;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.4 }}
    />
  );
}
