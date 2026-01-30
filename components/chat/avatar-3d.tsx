'use client';

import React, { useRef, useEffect, useState, Component, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Float, OrthographicCamera, useAnimations } from '@react-three/drei';
import { Vector3, Euler } from 'three';

interface Avatar3DProps {
    isSpeaking: boolean;
    modelUrl?: string;
}

class AvatarErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_: Error) {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error("Avatar 3D Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return null; // Render nothing if avatar fails
        }
        return this.props.children;
    }
}

// URL local del modelo (CesiumMan como fallback robusto)
const DEFAULT_AVATAR_URL = '/models/CesiumMan.glb';

interface Avatar3DProps {
    isSpeaking: boolean;
    modelUrl?: string;
}

function AvatarModel({ isSpeaking, modelUrl = DEFAULT_AVATAR_URL }: Avatar3DProps) {
    const { scene, animations } = useGLTF(modelUrl);
    const { actions } = useAnimations(animations, scene);
    const group = useRef<any>(null);

    useEffect(() => {
        // Play the first animation found (usually Walk for CesiumMan)
        // If we want Idle, we might need to stop it. 
        // CesiumMan only has "animation_0" which is a walk.
        // Let's play it slowly to simulate "alive".
        if (actions && animations.length > 0) {
            const action = actions[animations[0].name];
            if (action) {
                action.reset().fadeIn(0.5).play();
                action.timeScale = 0.5; // Slow walk
            }
        }
    }, [actions, animations]);

    useFrame((state) => {
        if (!group.current) return;

        // Simple "speaking" animation: bounce slightly
        if (isSpeaking) {
            group.current.scale.setScalar(2.1 + Math.sin(state.clock.elapsedTime * 10) * 0.05);
        } else {
            group.current.scale.setScalar(2);
        }
    });

    return (
        <group ref={group}>
            <primitive
                object={scene}
                position={[0, -2, 0]}
                rotation={[0, Math.PI / 4, 0]}
            />
        </group>
    );
}

export function Avatar3DWrapper({ isSpeaking }: { isSpeaking: boolean }) {
    return (
        <div className="w-full h-full">
            <Canvas className="bg-transparent" gl={{ alpha: true }} dpr={[1, 2]}>
                <OrthographicCamera makeDefault position={[0, 0, 5]} zoom={150} />

                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
                <pointLight position={[-10, 10, -5]} intensity={0.5} color="#blue" />

                <AvatarErrorBoundary>
                    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                        <AvatarModel isSpeaking={isSpeaking} />
                    </Float>
                </AvatarErrorBoundary>

                <Environment preset="city" />
            </Canvas>
        </div>
    );
}
