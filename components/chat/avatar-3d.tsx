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

function AvatarModel({ isSpeaking, modelUrl = DEFAULT_AVATAR_URL }: Avatar3DProps) {
    const { scene, animations } = useGLTF(modelUrl);
    const { actions } = useAnimations(animations, scene);
    const group = useRef<any>(null);

    useEffect(() => {
        if (actions && animations.length > 0) {
            const action = actions[animations[0].name];
            if (action) {
                action.reset().fadeIn(0.5).play();
                action.timeScale = 0.5;
            }
        }
    }, [actions, animations]);

    useFrame((state) => {
        if (!group.current) return;
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
                position={[0, -0.9, 0]}
                rotation={[0, Math.PI / 6, 0]}
            />
        </group>
    );
}

export function Avatar3DWrapper({ isSpeaking }: { isSpeaking: boolean }) {
    return (
        <div className="w-full h-full min-h-[400px]">
            <Canvas className="bg-transparent" camera={{ position: [0, 1.5, 4], fov: 50 }} gl={{ alpha: true }} dpr={[1, 2]}>

                <ambientLight intensity={1.5} />
                <directionalLight position={[5, 5, 5]} intensity={3} color="white" />

                <AvatarErrorBoundary>
                    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
                        <AvatarModel isSpeaking={isSpeaking} />
                    </Float>
                    {/* Debug Object: Red Box at origin */}
                    <mesh position={[1, 0, 0]}>
                        <boxGeometry args={[0.5, 0.5, 0.5]} />
                        <meshStandardMaterial color="red" />
                    </mesh>
                </AvatarErrorBoundary>
            </Canvas>
        </div>
    );
}
