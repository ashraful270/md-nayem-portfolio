import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RotateCw, Box, RotateCcw, Sparkles, Loader2 } from 'lucide-react';

interface ThreeModelViewerProps {
  modelType?: 'glb-custom' | 'procedural-cube' | 'procedural-torus' | 'procedural-mech';
  modelUrl?: string;
  title?: string;
}

export function ThreeModelViewer({
  modelType = 'procedural-mech',
  modelUrl,
  title = '3D Asset Inspector',
}: ThreeModelViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const materialsRef = useRef<THREE.Material[]>([]);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Reset state
    materialsRef.current = [];
    setLoadError(null);

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 6);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;
    controls.maxDistance = 14;
    controls.minDistance = 1.8;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x60a5fa, 2.5); // electric blue key
    dirLight1.position.set(5, 8, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 2.0); // purple fill
    dirLight2.position.set(-6, -4, -4);
    scene.add(dirLight2);

    const cyanRim = new THREE.PointLight(0x06b6d4, 3.5, 12); // cyan rim
    cyanRim.position.set(0, 5, -3);
    scene.add(cyanRim);

    // Group for objects
    const objectGroup = new THREE.Group();
    scene.add(objectGroup);

    // Load either GLTF or procedural mesh
    if (modelUrl && (modelUrl.endsWith('.glb') || modelUrl.endsWith('.gltf') || modelType === 'glb-custom')) {
      setIsLoading(true);
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          setIsLoading(false);
          const root = gltf.scene;

          // Compute bounding box to auto-center and scale
          const box = new THREE.Box3().setFromObject(root);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scale = 3.2 / maxDim;

          root.position.sub(center.multiplyScalar(scale));
          root.scale.setScalar(scale);

          root.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                  materialsRef.current.push(...mesh.material);
                } else {
                  materialsRef.current.push(mesh.material);
                }
              }
            }
          });

          objectGroup.add(root);
        },
        undefined,
        (err) => {
          console.warn('GLTF load failed, falling back to procedural mesh:', err);
          setIsLoading(false);
          setLoadError('Model file not reachable. Showing procedural wireframe model.');
          buildProceduralMesh(objectGroup, modelType);
        }
      );
    } else {
      buildProceduralMesh(objectGroup, modelType);
    }

    function buildProceduralMesh(group: THREE.Group, type: string) {
      if (type === 'procedural-torus') {
        const glowMat = new THREE.MeshStandardMaterial({
          color: 0x3b82f6,
          metalness: 0.85,
          roughness: 0.2,
          emissive: 0x1d4ed8,
          emissiveIntensity: 0.35,
        });
        materialsRef.current.push(glowMat);

        const coreMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          metalness: 0.95,
          roughness: 0.1,
        });
        materialsRef.current.push(coreMat);

        const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.3, 0.36, 128, 32, 2, 3), glowMat);
        group.add(knot);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.08, 16, 100), coreMat);
        group.add(ring);
      } else if (type === 'procedural-cube') {
        const cubeMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          metalness: 0.8,
          roughness: 0.25,
        });
        materialsRef.current.push(cubeMat);

        const cube = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, 2.0), cubeMat);
        group.add(cube);

        const cageMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true });
        materialsRef.current.push(cageMat);
        const cage = new THREE.Mesh(new THREE.BoxGeometry(2.25, 2.25, 2.25), cageMat);
        group.add(cage);
      } else {
        // procedural-mech: 6-Axis robotic arm joint assembly
        const baseMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          metalness: 0.85,
          roughness: 0.25,
        });
        materialsRef.current.push(baseMat);

        const blueMat = new THREE.MeshStandardMaterial({
          color: 0x3b82f6,
          metalness: 0.9,
          roughness: 0.15,
          emissive: 0x2563eb,
          emissiveIntensity: 0.3,
        });
        materialsRef.current.push(blueMat);

        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.4, 32), baseMat);
        base.position.y = -1.4;
        group.add(base);

        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.8, 32), baseMat);
        hub.position.y = -0.8;
        group.add(hub);

        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.8, 0.55), blueMat);
        arm.position.set(0, 0.3, 0);
        group.add(arm);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.14, 16, 64), blueMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 1), baseMat);
        head.position.y = 1.45;
        group.add(head);
      }
    }

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
    };
  }, [modelType, modelUrl]);

  // Wireframe toggle
  useEffect(() => {
    materialsRef.current.forEach((mat) => {
      if ('wireframe' in mat) {
        (mat as THREE.MeshStandardMaterial).wireframe = wireframe;
        mat.needsUpdate = true;
      }
    });
  }, [wireframe]);

  // Auto-rotate toggle
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Reset Camera View
  const handleResetView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 1.5, 6);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative w-full h-[360px] sm:h-[440px] md:h-[500px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#0a0f24] to-[#04060f] border border-blue-900/40 shadow-2xl flex flex-col">
      {/* 3D Viewport Header Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-blue-500/30 pointer-events-auto">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[11px] font-semibold tracking-wider text-slate-200 uppercase font-mono">
            {title}
          </span>
        </div>

        {/* Viewport Control Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-950/85 backdrop-blur-md p-1 rounded-xl border border-blue-500/30 shadow-lg">
          {/* Wireframe Button with active/inactive state */}
          <button
            type="button"
            onClick={() => setWireframe(!wireframe)}
            title="Toggle Wireframe Inspection"
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              wireframe
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Wireframe</span>
          </button>

          {/* Orbit Control Toggle */}
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle Auto Orbit"
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              autoRotate
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Orbit</span>
          </button>

          {/* Reset Camera */}
          <button
            type="button"
            onClick={handleResetView}
            title="Reset Camera View"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
          <p className="text-xs font-mono text-cyan-200">Loading 3D Mesh Geometry...</p>
        </div>
      )}

      {/* Optional load notification */}
      {loadError && (
        <div className="absolute top-14 left-4 right-4 z-10 px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/30 text-[11px] font-mono text-amber-300 pointer-events-none">
          {loadError}
        </div>
      )}

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full flex-1 cursor-grab active:cursor-grabbing touch-none" />

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-slate-400 font-mono pointer-events-none">
        <span>Click &amp; drag to rotate · Scroll/pinch to zoom</span>
        <span className="text-cyan-400/90 font-medium">Three.js Realtime Viewport</span>
      </div>
    </div>
  );
}
