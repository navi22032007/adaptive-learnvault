import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { mockKnowledgeGraph } from '../../data/mockData';

export default function KnowledgeGraph({ onNodeClick }) {
  const canvasRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const sceneRef = useRef({});
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.2, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const W = canvas.parentElement.offsetWidth;
    const H = canvas.parentElement.offsetHeight;
    renderer.setSize(W, H);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 7;

    const { nodes, edges } = mockKnowledgeGraph;

    // Create node meshes
    const nodeMeshes = {};
    const nodeMap = {};
    nodes.forEach((n) => {
      nodeMap[n.id] = n;
      const geo = new THREE.SphereGeometry(n.size * 0.18, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(n.color),
        emissive: new THREE.Color(n.color),
        emissiveIntensity: 0.3,
        roughness: 0.4,
        metalness: 0.6,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(n.x, n.y, n.z);
      mesh.userData = { id: n.id, label: n.label, originalColor: n.color };
      scene.add(mesh);
      nodeMeshes[n.id] = mesh;
    });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xff6a00, 1.5, 20);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    // Edges
    edges.forEach(([a, b]) => {
      const nA = nodeMap[a];
      const nB = nodeMap[b];
      if (!nA || !nB) return;
      const pts = [
        new THREE.Vector3(nA.x, nA.y, nA.z),
        new THREE.Vector3(nB.x, nB.y, nB.z),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: 0xff6a00,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
      });
      scene.add(new THREE.Line(geo, mat));
    });

    // Labels (canvas textures)
    nodes.forEach((n) => {
      const cvs = document.createElement('canvas');
      cvs.width = 256;
      cvs.height = 64;
      const ctx = cvs.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.clearRect(0, 0, 256, 64);
      ctx.font = 'bold 22px "DM Sans", sans-serif';
      ctx.fillStyle = '#f0ece4';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, 128, 38);
      const texture = new THREE.CanvasTexture(cvs);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.8 });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(1.2, 0.3, 1);
      sprite.position.set(n.x, n.y + n.size * 0.28 + 0.3, n.z);
      sprite.renderOrder = 1;
      scene.add(sprite);
    });

    sceneRef.current = { scene, camera, renderer, nodeMeshes };

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging.current) {
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        rotationRef.current.y += dx * 0.005;
        rotationRef.current.x += dy * 0.005;
        lastMouse.current = { x: e.clientX, y: e.clientY };
        return;
      }

      raycaster.setFromCamera(pointer, camera);
      const meshList = Object.values(nodeMeshes);
      const intersects = raycaster.intersectObjects(meshList);

      meshList.forEach((m) => {
        m.material.emissiveIntensity = 0.3;
        m.scale.set(1, 1, 1);
      });

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        hit.material.emissiveIntensity = 1.2;
        hit.scale.set(1.3, 1.3, 1.3);
        setHoveredNode(hit.userData.label);
        canvas.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        canvas.style.cursor = 'grab';
      }
    };

    const handleClick = (e) => {
      raycaster.setFromCamera(pointer, camera);
      const meshList = Object.values(nodeMeshes);
      const intersects = raycaster.intersectObjects(meshList);
      if (intersects.length > 0) {
        onNodeClick?.(intersects[0].object.userData.id);
      }
    };

    const handleMouseDown = (e) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    const handleResize = () => {
      const W2 = canvas.parentElement.offsetWidth;
      const H2 = canvas.parentElement.offsetHeight;
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };
    window.addEventListener('resize', handleResize);

    let t = 0;
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      t += 0.005;

      if (!isDragging.current) {
        rotationRef.current.y += 0.002;
      }
      scene.rotation.y = rotationRef.current.y;
      scene.rotation.x = rotationRef.current.x;

      // Pulse nodes
      Object.values(nodeMeshes).forEach((m, i) => {
        const pulse = 1 + Math.sin(t * 1.5 + i * 0.5) * 0.04;
        if (m.scale.x < 1.2) m.scale.set(pulse, pulse, pulse);
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: 'grab' }}
      />
      {hoveredNode && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full font-mono text-sm pointer-events-none"
          style={{ background: 'rgba(255,106,0,0.15)', border: '1px solid rgba(255,106,0,0.4)', color: '#ff8c42' }}
        >
          {hoveredNode}
        </div>
      )}
      <div className="absolute top-3 right-3 font-mono text-xs" style={{ color: 'rgba(255,106,0,0.4)' }}>
        drag to rotate · click to filter
      </div>
    </div>
  );
}
