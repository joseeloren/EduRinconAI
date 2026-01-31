'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { AnimationClip, Object3D, AnimationUtils } from 'three';

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

// Helper to manually trim start of animation (remove T-pose)
function trimClip(clip: AnimationClip, timeToRemove: number = 0.33) { // Increased to 0.33s (~10 frames)
    if (clip.duration <= timeToRemove) return clip; // Don't trim if too short

    clip.tracks.forEach(track => {
        const times = track.times;
        const values = track.values;
        const itemSize = values.length / times.length;

        const newTimes: number[] = [];
        const newValues: number[] = [];

        for (let i = 0; i < times.length; i++) {
            if (times[i] >= timeToRemove) {
                newTimes.push(times[i] - timeToRemove);
                for (let k = 0; k < itemSize; k++) {
                    newValues.push(values[i * itemSize + k]);
                }
            }
        }

        if (newTimes.length > 0) {
            track.times = new Float32Array(newTimes);
            track.values = new Float32Array(newValues);
        }
    });
    clip.duration = Math.max(0, clip.duration - timeToRemove);
    return clip;
}

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
                // Check if already trimmed to avoid double trimming on re-renders
                if (!clip.name.startsWith('Idle_')) {
                    clip.name = `Idle_${i}`;
                    trimClip(clip, 0.33);
                }
            });
            return clips;
        });
    }, [idleGLTFs]);

    const talkingClips = useMemo(() => {
        return talkingGLTFs.flatMap((gltf, i) => {
            const clips = gltf.animations || [];
            clips.forEach((clip: AnimationClip) => {
                if (!clip.name.startsWith('Talking_')) {
                    clip.name = `Talking_${i}`;
                    trimClip(clip, 0.33);
                }
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
        } else {
            desiredAction.fadeIn(0.5).play();
        }

        // Crossfade others out
        Object.keys(actions).forEach(key => {
            if (key !== desiredActionName) {
                const action = actions[key];
                if (action && action.isRunning()) {
                    action.fadeOut(0.5);
                }
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

export function Avatar3DWrapper({ isSpeaking }: { isSpeaking: boolean }) {
    // Hardcoded model
    const startModel = '/models/profe.glb';

    return (
        <div className="w-full h-full min-h-[400px] flex flex-col relative">
            <Canvas className="flex-1 bg-transparent" camera={{ position: [0, 0.2, 5.5], fov: 45 }} gl={{ alpha: true }} dpr={[1, 2]}>

                <ambientLight intensity={1.8} />
                <directionalLight position={[0, 5, 5]} intensity={3} color="white" />
                <pointLight position={[-5, 5, -5]} intensity={2} color="#4444ff" />

                <AvatarModel
                    isSpeaking={isSpeaking}
                    modelUrl={startModel}
                />
            </Canvas>
        </div>
    );
}
