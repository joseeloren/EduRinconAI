'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, useFBX } from '@react-three/drei';
import { AnimationClip, Object3D } from 'three';

type BoneRotation = { x: number; y: number; z: number };

type DebugPose = {
    rightArm: BoneRotation;
    rightForeArm: BoneRotation;
    rightHand: BoneRotation;
    leftArm: BoneRotation;
    leftForeArm: BoneRotation;
    leftHand: BoneRotation;
};

interface Avatar3DProps {
    isSpeaking: boolean;
    modelUrl?: string;
    debugPose?: DebugPose | null;
}

// URL local del modelo (usar modelo humano por defecto)
const DEFAULT_AVATAR_URL = '/models/CesiumMan.glb';

function AvatarModel({ isSpeaking, modelUrl = DEFAULT_AVATAR_URL, debugPose }: Avatar3DProps) {
    const group = useRef<any>(null);
    const { scene } = useGLTF(modelUrl);

    // Load Animations (FBX)
    // Note: These need to be present in public/animations/
    // We use a try/catch pattern or error boundary implicitly by how/drei handles it? 
    // Actually useFBX will suspend. If files missing, it might error.
    // For safety, we can preload or just let it fail to console if missing.
    const { animations: idleAnims } = useFBX('/animations/Idle.fbx');
    const { animations: talkingAnims } = useFBX('/animations/Talking.fbx');

    // Rename clips to identifiable names
    if (idleAnims[0]) idleAnims[0].name = 'Idle';
    if (talkingAnims[0]) talkingAnims[0].name = 'Talking';

    const { actions } = useAnimations([idleAnims[0], talkingAnims[0]], group);

    useEffect(() => {
        // Reset and fade all actions
        Object.values(actions).forEach(action => action?.fadeOut(0.5));

        if (isSpeaking) {
            if (actions['Talking']) {
                actions['Talking'].reset().fadeIn(0.5).play();
            } else {
                // Fallback if missing
                console.warn("Missing Talking animation");
            }
        } else {
            if (actions['Idle']) {
                actions['Idle'].reset().fadeIn(0.5).play();
            }
        }
    }, [isSpeaking, actions]);

    useFrame((state) => {
        if (!group.current) return;

        // Debug Pose Logic (Optional Override)
        if (debugPose) {
            const nodes = group.current.nodes || {}; // This might need accessing underlying nodes from scene traverse if using GLTF scene directly
            // ... legacy debug logic ... 
            // Ideally we should traverse 'scene' to find bones, not rely on 'nodes' from useGLTF hook if we didn't destructure it dynamically.
            // For now, let's keep debug disabled or simple.
        }
    });

    return (
        <group ref={group}>
            <primitive
                object={scene}
                position={[0, -1.6, 0]} // Stand on ground
                rotation={[0, modelUrl.includes('Soldier.glb') ? Math.PI : 0, 0]} // Face forward
                scale={1.5}
            />
        </group>
    );
}

// Preload to prevent suspense stutter
useFBX.preload('/animations/Idle.fbx');
useFBX.preload('/animations/Talking.fbx');

const BoneControl = ({ label, value, onChange }: { label: string, value: BoneRotation, onChange: (v: BoneRotation) => void }) => {
    return (
        <div className="mb-2 p-2 border border-blue-100 rounded bg-blue-50/50">
            <div className="text-xs font-bold mb-1 text-blue-800">{label}</div>
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <span className="w-3 text-[10px] font-bold text-red-500">X</span>
                    <input type="range" min="-3.14" max="3.14" step="0.05" value={value.x}
                        onChange={(e) => onChange({ ...value, x: parseFloat(e.target.value) })} className="flex-1 h-1" />
                    <span className="w-6 text-[10px] text-right font-mono">{value.x.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 text-[10px] font-bold text-green-500">Y</span>
                    <input type="range" min="-3.14" max="3.14" step="0.05" value={value.y}
                        onChange={(e) => onChange({ ...value, y: parseFloat(e.target.value) })} className="flex-1 h-1" />
                    <span className="w-6 text-[10px] text-right font-mono">{value.y.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 text-[10px] font-bold text-blue-500">Z</span>
                    <input type="range" min="-3.14" max="3.14" step="0.05" value={value.z}
                        onChange={(e) => onChange({ ...value, z: parseFloat(e.target.value) })} className="flex-1 h-1" />
                    <span className="w-6 text-[10px] text-right font-mono">{value.z.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export function Avatar3DWrapper({ isSpeaking }: { isSpeaking: boolean }) {
    const [models, setModels] = useState<Array<{ name: string; url: string }>>([]);
    const [selected, setSelected] = useState<string>(DEFAULT_AVATAR_URL);

    // DEBUG STATE
    const [showDebug, setShowDebug] = useState(false);
    const [debugPose, setDebugPose] = useState<DebugPose>({
        rightArm: { x: 0, y: 0, z: -1.3 },
        rightForeArm: { x: 0, y: 0, z: 0 },
        rightHand: { x: 0, y: 0, z: 0 },
        leftArm: { x: 0, y: 0, z: 1.3 },
        leftForeArm: { x: 0, y: 0, z: 0 },
        leftHand: { x: 0, y: 0, z: 0 },
    });

    useEffect(() => {
        // Load saved selection from localStorage on mount
        try {
            const saved = localStorage.getItem('selectedAvatarModel');
            if (saved) setSelected(saved);
        } catch (e) { }
    }, []);

    useEffect(() => {
        // Fetch available models from API
        fetch('/api/models')
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setModels(data);
                    // Validate saved selection exists in available models
                    setSelected((prev) => {
                        const exists = data.some((m: { url: string }) => m.url === prev);
                        if (!exists) {
                            try { localStorage.setItem('selectedAvatarModel', DEFAULT_AVATAR_URL); } catch { }
                            return DEFAULT_AVATAR_URL;
                        }
                        return prev;
                    });
                }
            })
            .catch((err) => console.error('Failed to load models:', err));
    }, []);

    const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelected(val);
        try { localStorage.setItem('selectedAvatarModel', val); } catch (e) { }
    };

    const options = models.length > 0
        ? models
        : [{ name: 'Humano (por defecto)', url: DEFAULT_AVATAR_URL }];

    const updateBone = (bone: keyof DebugPose, val: BoneRotation) => {
        setDebugPose(prev => ({ ...prev, [bone]: val }));
    };

    return (
        <div className="w-full h-full min-h-[400px] flex flex-col relative">
            <div className="mb-2 flex flex-col gap-2 pointer-events-auto relative z-20 bg-white/90 p-2 rounded shadow-sm">
                <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 font-medium">Modelo 3D:</label>
                    <select
                        value={selected}
                        onChange={onChange}
                        className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {options.map((m) => (
                            <option key={m.url} value={m.url}>{m.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className={`text-xs px-2 py-1 rounded font-medium ${showDebug ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}
                    >
                        {showDebug ? 'Cerrar Debug' : 'Debug'}
                    </button>
                </div>

                {showDebug && (
                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 border-t pt-2">
                        <div className="text-[10px] text-gray-500 text-center font-mono">DEBUG MODE ACTIVE - ANIMATION PAUSED</div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <h4 className="font-bold text-xs text-center mb-1 text-gray-700">RIGHT (Derecha)</h4>
                                <BoneControl label="Right Arm (Hombro)" value={debugPose.rightArm} onChange={(v) => updateBone('rightArm', v)} />
                                <BoneControl label="Right ForeArm (Codo)" value={debugPose.rightForeArm} onChange={(v) => updateBone('rightForeArm', v)} />
                                <BoneControl label="Right Hand (Mano)" value={debugPose.rightHand} onChange={(v) => updateBone('rightHand', v)} />
                            </div>
                            <div>
                                <h4 className="font-bold text-xs text-center mb-1 text-gray-700">LEFT (Izquierda)</h4>
                                <BoneControl label="Left Arm (Hombro)" value={debugPose.leftArm} onChange={(v) => updateBone('leftArm', v)} />
                                <BoneControl label="Left ForeArm (Codo)" value={debugPose.leftForeArm} onChange={(v) => updateBone('leftForeArm', v)} />
                                <BoneControl label="Left Hand (Mano)" value={debugPose.leftHand} onChange={(v) => updateBone('leftHand', v)} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Canvas className="flex-1 bg-transparent" camera={{ position: [0, 0.2, 5.5], fov: 45 }} gl={{ alpha: true }} dpr={[1, 2]}>

                <ambientLight intensity={1.8} />
                <directionalLight position={[0, 5, 5]} intensity={3} color="white" />
                <pointLight position={[-5, 5, -5]} intensity={2} color="#4444ff" />

                <AvatarModel
                    isSpeaking={isSpeaking}
                    modelUrl={selected}
                    debugPose={showDebug ? debugPose : null}
                />
            </Canvas>
        </div>
    );
}
