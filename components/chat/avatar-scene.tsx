'use client';

import React, { useRef, useEffect, useState, useMemo, Component, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
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

// ... helper functions ...

function AvatarModel({ isSpeaking, modelUrl = DEFAULT_AVATAR_URL, debugPose }: Avatar3DProps) {
    const { scene, animations, nodes } = useGLTF(modelUrl);
    const filteredAnimations = useMemo(
        () => (animations?.length ? filterAnimationsToMatchScene(animations, scene) : []),
        [animations, scene]
    );
    const { actions } = useAnimations(filteredAnimations, scene);
    const group = useRef<any>(null);

    useEffect(() => {
        // Play 'Idle' animation if available
        if (actions && actions['Idle']) {
            actions['Idle'].reset().fadeIn(0.5).play();
        } else if (actions && Object.keys(actions).length > 0) {
            const first = Object.keys(actions)[0];
            actions[first]?.reset().fadeIn(0.5).play();
        }
    }, [actions]);

    useFrame((state) => {
        if (!group.current) return;

        const t = state.clock.elapsedTime;

        const rightArm = nodes.mixamorigRightArm || nodes.RightArm;
        const rightForeArm = nodes.mixamorigRightForeArm || nodes.RightForeArm;
        const leftArm = nodes.mixamorigLeftArm || nodes.LeftArm;
        const leftForeArm = nodes.mixamorigLeftForeArm || nodes.LeftForeArm;
        const head = nodes.mixamorigHead || nodes.Head;
        const rightHand = nodes.mixamorigRightHand || nodes.RightHand;
        const leftHand = nodes.mixamorigLeftHand || nodes.LeftHand;

        if (debugPose) {
            // DEBUG MODE: Apply manual Rotation to ALL bones
            if (rightArm) {
                rightArm.rotation.x = debugPose.rightArm.x;
                rightArm.rotation.y = debugPose.rightArm.y;
                rightArm.rotation.z = debugPose.rightArm.z;
            }
            if (rightForeArm) {
                rightForeArm.rotation.x = debugPose.rightForeArm.x;
                rightForeArm.rotation.y = debugPose.rightForeArm.y;
                rightForeArm.rotation.z = debugPose.rightForeArm.z;
            }
            if (rightHand) {
                rightHand.rotation.x = debugPose.rightHand.x;
                rightHand.rotation.y = debugPose.rightHand.y;
                rightHand.rotation.z = debugPose.rightHand.z;
            }

            if (leftArm) {
                leftArm.rotation.x = debugPose.leftArm.x;
                leftArm.rotation.y = debugPose.leftArm.y;
                leftArm.rotation.z = debugPose.leftArm.z;
            }
            if (leftForeArm) {
                leftForeArm.rotation.x = debugPose.leftForeArm.x;
                leftForeArm.rotation.y = debugPose.leftForeArm.y;
                leftForeArm.rotation.z = debugPose.leftForeArm.z;
            }
            if (leftHand) {
                leftHand.rotation.x = debugPose.leftHand.x;
                leftHand.rotation.y = debugPose.leftHand.y;
                leftHand.rotation.z = debugPose.leftHand.z;
            }

        } else if (isSpeaking) {
            /* ===========================
           SPEAKING – EXPLICANDO
           =========================== */
            const breathe = Math.sin(t * 0.6) * 0.015;
            const emphasis = Math.sin(t * 2.2) * 0.05;
            const sway = Math.sin(t * 0.4) * 0.04;

            // RIGHT ARM
            if (rightArm) {
                rightArm.rotation.x = 0.75 + breathe + emphasis * 0.6;
                rightArm.rotation.y = -0.10 + sway;
                rightArm.rotation.z = -1.05;
            }
            if (rightForeArm) {
                rightForeArm.rotation.x = -0.45 + emphasis;
                rightForeArm.rotation.y = 0;
                rightForeArm.rotation.z = 0;
            }

            // LEFT ARM
            if (leftArm) {
                leftArm.rotation.x = 0.75 + breathe + emphasis * 0.6;
                leftArm.rotation.y = 0.10 - sway;
                leftArm.rotation.z = 1.05;
            }
            if (leftForeArm) {
                leftForeArm.rotation.x = -0.45 + emphasis;
                leftForeArm.rotation.y = 0;
                leftForeArm.rotation.z = 0;
            }

            // HANDS (palmas abiertas)
            if (rightHand) {
                rightHand.rotation.x = 0.2;
                rightHand.rotation.y = -0.1;
                rightHand.rotation.z = 0;
            }
            if (leftHand) {
                leftHand.rotation.x = 0.2;
                leftHand.rotation.y = 0.1;
                leftHand.rotation.z = 0;
            }

            // HEAD – acompañando el discurso
            if (head) {
                head.rotation.x = emphasis * 0.25;
                head.rotation.y = Math.sin(t * 1.2) * 0.05;
            }
        } else {
            // RELAXED IDLE
            const breathe = Math.sin(t * 0.35) * 0.02;

            // RIGHT ARM
            if (rightArm) {
                rightArm.rotation.x = 0.35 + breathe;
                rightArm.rotation.y = -0.05;
                rightArm.rotation.z = -1.30;
            }
            if (rightForeArm) {
                rightForeArm.rotation.x = -0.75;
                rightForeArm.rotation.y = 0;
                rightForeArm.rotation.z = 0;
            }

            // LEFT ARM
            if (leftArm) {
                leftArm.rotation.x = 0.35 + breathe;
                leftArm.rotation.y = 0.05;
                leftArm.rotation.z = 1.30;
            }
            if (leftForeArm) {
                leftForeArm.rotation.x = -0.75;
                leftForeArm.rotation.y = 0;
                leftForeArm.rotation.z = 0;
            }

            // HEAD
            if (head) {
                head.rotation.x = 0;
                head.rotation.y = Math.sin(t * 0.25) * 0.03;
            }
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

                <AvatarErrorBoundary>
                    <AvatarModel
                        isSpeaking={isSpeaking}
                        modelUrl={selected}
                        debugPose={showDebug ? debugPose : null}
                    />
                </AvatarErrorBoundary>
            </Canvas>
        </div>
    );
}
