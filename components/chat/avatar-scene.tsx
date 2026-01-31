'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
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

// URL local del modelo (usar modelo humano por defecto)
const DEFAULT_AVATAR_URL = '/models/CesiumMan.glb';

// --- PLAYLIST CONFIG ---
// Load all available variations
const IDLE_FILES = [
    'M_Standing_Idle_001.glb',
    'M_Standing_Idle_002.glb',
    // Variations (001-010)
    ...Array.from({ length: 10 }, (_, i) => `M_Standing_Idle_Variations_${String(i + 1).padStart(3, '0')}.glb`),
    // Expressions (001-018, skipping 003 which is missing)
    ...Array.from({ length: 18 }, (_, i) => i + 1)
        .filter(n => n !== 3)
        .map(n => `M_Standing_Expressions_${String(n).padStart(3, '0')}.glb`)
].map(f => `/animations/${f}`);

const TALKING_FILES = [
    ...Array.from({ length: 10 }, (_, i) => `M_Talking_Variations_${String(i + 1).padStart(3, '0')}.glb`)
].map(f => `/animations/${f}`);

function AvatarModel({ isSpeaking, modelUrl = DEFAULT_AVATAR_URL, debugPose }: Avatar3DProps) {
    const group = useRef<any>(null);
    const { scene } = useGLTF(modelUrl);

    // Load ALL animations
    const idleGLTFs = useGLTF(IDLE_FILES) as any[];
    const talkingGLTFs = useGLTF(TALKING_FILES) as any[];

    // Extract and rename clips to be unique
    const idleClips = useMemo(() => {
        return idleGLTFs.flatMap((gltf, i) => {
            const clips = gltf.animations || [];
            clips.forEach((clip: AnimationClip) => {
                clip.name = `Idle_${i}`; // Unique name
            });
            return clips;
        });
    }, [idleGLTFs]);

    const talkingClips = useMemo(() => {
        return talkingGLTFs.flatMap((gltf, i) => {
            const clips = gltf.animations || [];
            clips.forEach((clip: AnimationClip) => {
                clip.name = `Talking_${i}`;
            });
            return clips;
        });
    }, [talkingGLTFs]);

    // Combine all for the mixer
    const { actions } = useAnimations([...idleClips, ...talkingClips], group);

    // State to track current animation index
    const [currentIdleIdx, setCurrentIdleIdx] = useState(0);
    const [currentTalkingIdx, setCurrentTalkingIdx] = useState(0);

    // Randomizer effect
    useEffect(() => {
        let timeout: NodeJS.Timeout;

        const loop = () => {
            // Pick next random duration between 3s and 8s
            const duration = 3000 + Math.random() * 5000;

            timeout = setTimeout(() => {
                if (isSpeaking) {
                    // Switch talking anim
                    const next = Math.floor(Math.random() * talkingClips.length);
                    setCurrentTalkingIdx(next);
                } else {
                    // Switch idle anim
                    const next = Math.floor(Math.random() * idleClips.length);
                    setCurrentIdleIdx(next);
                }
                loop();
            }, duration);
        };

        loop();
        return () => clearTimeout(timeout);
    }, [isSpeaking, idleClips.length, talkingClips.length]);

    // Playback Controller
    useEffect(() => {
        // Fade out everything that isn't current
        const desiredActionName = isSpeaking
            ? `Talking_${currentTalkingIdx}`
            : `Idle_${currentIdleIdx}`;

        const desiredAction = actions[desiredActionName];

        // If track missing, fallback
        if (!desiredAction) return;

        // Ensure it's playing
        if (!desiredAction.isRunning()) {
            desiredAction.reset().fadeIn(0.5).play();
        }

        // Crossfade others out
        Object.keys(actions).forEach(key => {
            if (key !== desiredActionName) {
                actions[key]?.fadeOut(0.5);
            }
        });

    }, [isSpeaking, currentIdleIdx, currentTalkingIdx, actions]);

    useFrame((state) => {
        if (!group.current) return;
        // ... debug logic removed for clarity ... 
    });

    return (
        <group ref={group}>
            <primitive
                object={scene}
                position={[0, -1.6, 0]}
                rotation={[0, modelUrl.includes('Soldier.glb') ? Math.PI : 0, 0]}
                scale={1.5}
            />
        </group>
    );
}


// Preload assets
IDLE_FILES.forEach(url => useGLTF.preload(url));
TALKING_FILES.forEach(url => useGLTF.preload(url));

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
    // Hardcoded model
    const startModel = '/models/profe.glb';

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

    const updateBone = (bone: keyof DebugPose, val: BoneRotation) => {
        setDebugPose(prev => ({ ...prev, [bone]: val }));
    };

    return (
        <div className="w-full h-full min-h-[400px] flex flex-col relative">
            <div className="mb-2 flex flex-col gap-2 pointer-events-auto relative z-20 bg-white/90 p-2 rounded shadow-sm">
                <div className="flex justify-end">
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
                    modelUrl={startModel}
                    debugPose={showDebug ? debugPose : null}
                />
            </Canvas>
        </div>
    );
}
