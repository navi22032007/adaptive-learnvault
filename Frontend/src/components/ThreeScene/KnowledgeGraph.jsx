import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store';

export default function KnowledgeGraph({ onNodeClick }) {
  const canvasRef = useRef(null);
  const { knowledgeGraph } = useStore();
  const [hoveredNode, setHoveredNode] = useState(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const sceneRef = useRef({});
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.2, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !knowledgeGraph.nodes.length) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const W = canvas.parentElement.offsetWidth;
    const H = canvas.parentElement.offsetHeight;
    renderer.setSize(W, H);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 7;

    const { nodes, edges } = knowledgeGraph;
    const group = new THREE.Group();
    scene.add(group);

    // Create Nodes
    const nodeMeshes = [];
    nodes.forEach((node) => {
      const geometry = new THREE.SphereGeometry(node.size * 0.15, 32, 32);
      const material = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color(node.color),
        transparent: true,
        opacity: 0.9 
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(node.x, node.y, node.z);
      mesh.userData = { id: node.id, label: node.label };
      group.add(mesh);
      nodeMeshes.push(mesh);

      // Add Glow
      const glowGeo = new THREE.SphereGeometry(node.size * 0.25, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color(node.color),
        transparent: true,
        opacity: 0.1 
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.set(node.x, node.y, node.z);
      group.add(glowMesh);
    });

    // Create Edges
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x0891b2, 
      transparent: true, 
      opacity: 0.15 
    });
    edges.forEach(([sourceId, targetId]) => {
      const source = nodes.find(n => n.id === sourceId);
      const target = nodes.find(n => n.id === targetId);
      if (source && target) {
        const points = [
          new THREE.Vector3(source.x, source.y, source.z),
          new THREE.Vector3(target.x, target.y, target.z)
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, lineMaterial);
        group.add(line);
      }
    });

    sceneRef.current = { scene, camera, renderer, group, nodeMeshes };

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      
      if (!isDragging.current) {
        rotationRef.current.y += 0.002;
      }
      
      group.rotation.x = rotationRef.current.x;
      group.rotation.y = rotationRef.current.y;
      
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const newW = canvas.parentElement.offsetWidth;
      const newH = canvas.parentElement.offsetHeight;
      renderer.setSize(newW, newH);
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafRef.current);
      renderer.dispose();
    };
  }, [knowledgeGraph]);

  const onPointerDown = (e) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e) => {
    if (isDragging.current) {
      const deltaX = e.clientX - lastMouse.current.x;
      const deltaY = e.clientY - lastMouse.current.y;
      rotationRef.current.y += deltaX * 0.01;
      rotationRef.current.x += deltaY * 0.01;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }

    // Raycasting for hover
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    const { camera, nodeMeshes, group } = sceneRef.current;
    if (!camera) return;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x, y }, camera);
    
    // We need to account for group rotation in raycasting
    const intersects = raycaster.intersectObjects(nodeMeshes);
    if (intersects.length > 0) {
      setHoveredNode(intersects[0].object.userData.label);
      canvasRef.current.style.cursor = 'pointer';
    } else {
      setHoveredNode(null);
      canvasRef.current.style.cursor = 'grab';
    }
  };

  const onPointerUp = () => {
    isDragging.current = false;
  };

  const onClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    const { camera, nodeMeshes } = sceneRef.current;
    if (!camera) return;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x, y }, camera);
    const intersects = raycaster.intersectObjects(nodeMeshes);
    
    if (intersects.length > 0) {
      onNodeClick(intersects[0].object.userData.id);
    }
  };

  return (
    <div className="w-full h-full relative group">
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={onClick}
      />
      {hoveredNode && (
        <div 
          className="absolute pointer-events-none px-3 py-1.5 rounded-lg bg-orange-primary text-white text-xs font-bold font-display shadow-xl border border-white/20"
          style={{ top: '20px', left: '20px' }}
        >
          {hoveredNode}
        </div>
      )}
      <div className="absolute top-3 right-3 font-mono text-[9px] text-white/20 uppercase tracking-widest">
        Interact to filter
      </div>
    </div>
  );
}
