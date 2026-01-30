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

// URL local del modelo (Human Figure)
const DEFAULT_AVATAR_URL = '/models/teacher.glb';

function AvatarModel({ isSpeaking, modelUrl = DEFAULT_AVATAR_URL }: Avatar3DProps) {
    const { scene } = useGLTF(modelUrl);
    const group = useRef<any>(null);

    useFrame((state) => {
        if (!group.current) return;

        // Idle animation (Breathing)
        const t = state.clock.elapsedTime;
        group.current.position.y = -0.5 + Math.sin(t) * 0.05;

        // Speaking animation (Bounce + Rotate)
        if (isSpeaking) {
            group.current.scale.setScalar(1.2 + Math.sin(t * 15) * 0.02);
            group.current.rotation.y = Math.sin(t * 5) * 0.05;
        } else {
            group.current.scale.setScalar(1.2);
            group.current.rotation.y = Math.sin(t * 0.5) * 0.05; // Slow sway
        }
    });

    return (
        <group ref={group}>
            <primitive
                object={scene}
                position={[0, -0.5, 0]}
                rotation={[0, 0, 0]}
            />
        </group>
    );
}

export function Avatar3DWrapper({ isSpeaking }: { isSpeaking: boolean }) {
    return (
        <div className="w-full h-full min-h-[400px]">
            <Canvas className="bg-transparent" camera={{ position: [0, 0.5, 3.5], fov: 45 }} gl={{ alpha: true }} dpr={[1, 2]}>

                <ambientLight intensity={1.8} />
                <directionalLight position={[0, 5, 5]} intensity={3} color="white" />
                <pointLight position={[-5, 5, -5]} intensity={2} color="#4444ff" />

                <AvatarErrorBoundary>
                    <Float speed={2} rotationIntensity={0.05} floatIntensity={0.1}>
                        <AvatarModel isSpeaking={isSpeaking} />
                    </Float>
                </AvatarErrorBoundary>
            </Canvas>
        </div>
    );
}
