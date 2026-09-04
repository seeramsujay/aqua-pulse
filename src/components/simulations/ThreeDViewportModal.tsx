import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { X, Box, RefreshCw, Layers } from 'lucide-react';

interface ThreeDViewportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ThreeDViewportModal: React.FC<ThreeDViewportModalProps> = ({ isOpen, onClose }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !mountRef.current) return;

        const container = mountRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene, Camera, Renderer
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x020612);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(16, 12, 18);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);

        // Orbit Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x00f0ff, 0.8);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
        dirLight.position.set(10, 20, 15);
        scene.add(dirLight);

        const blueSpot = new THREE.PointLight(0x0096c7, 10, 50);
        blueSpot.position.set(0, 5, 0);
        scene.add(blueSpot);

        // Load Blender Exported GLB Model
        const loader = new GLTFLoader();
        setLoading(true);
        setError(null);

        loader.load(
            '/models/aquapulse_digital_twin.glb',
            (gltf) => {
                const model = gltf.scene;
                scene.add(model);
                setLoading(false);
            },
            undefined,
            (err) => {
                console.error('Failed to load 3D GLB model:', err);
                setError('Could not load 3D GLB model. Standard WebGL fallback active.');
                setLoading(false);

                // Fallback 3D AUV Primitive Representation
                const group = new THREE.Group();
                const hullGeo = new THREE.CylinderGeometry(1.2, 1.2, 7, 32);
                const hullMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8, roughness: 0.2 });
                const hull = new THREE.Mesh(hullGeo, hullMat);
                hull.rotation.z = Math.PI / 2;
                group.add(hull);

                const noseGeo = new THREE.SphereGeometry(1.2, 32, 32);
                const noseMat = new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.9, roughness: 0.1 });
                const nose = new THREE.Mesh(noseGeo, noseMat);
                nose.position.x = 3.5;
                group.add(nose);

                scene.add(group);
            }
        );

        // Animation Loop
        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
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
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-5xl h-[80vh] bg-slate-950/90 border border-cyan-500/40 rounded-2xl flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.2)]">
                {/* Modal Header */}
                <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-cyan-950/40">
                    <div className="flex items-center gap-2.5">
                        <Box className="w-5 h-5 text-cyan-400" />
                        <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-widest">
                            Blender 3D CAD &amp; Ray Physics Viewport
                        </h3>
                        <span className="hud-chip bg-cyan-950 text-cyan-300 border-cyan-700/50">
                            GLB Model Render
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 3D Viewport Canvas Area */}
                <div className="relative flex-1 w-full h-full" ref={mountRef}>
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 font-mono text-cyan-400 text-xs gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Rendering 3D Blender GLB Geometry...</span>
                        </div>
                    )}
                    {error && (
                        <div className="absolute top-4 left-4 right-4 p-3 bg-amber-950/80 border border-amber-500/40 rounded-lg text-amber-300 font-mono text-xs">
                            {error}
                        </div>
                    )}

                    {/* Overlay Controls Guide */}
                    <div className="absolute bottom-4 left-4 p-3 rounded-xl border border-white/10 bg-slate-950/70 font-mono text-[10px] text-slate-400 space-y-1">
                        <div className="text-cyan-300 font-bold flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            Interactive 3D Controls
                        </div>
                        <div>Left Click + Drag: Orbit Camera</div>
                        <div>Right Click + Drag: Pan Viewport</div>
                        <div>Scroll Wheel: Zoom In / Out</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// EOF: src/components/simulations/ThreeDViewportModal.tsx
