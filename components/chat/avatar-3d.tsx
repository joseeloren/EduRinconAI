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

// URL local del modelo (usar modelo humano por defecto)
const DEFAULT_AVATAR_URL = '/models/CesiumMan.glb';

function AvatarModel({ isSpeaking, modelUrl = DEFAULT_AVATAR_URL }: Avatar3DProps) {
    // @ts-ignore
    const { scene, animations, nodes } = useGLTF(modelUrl);
    const { actions } = useAnimations(animations, scene);
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

        // Find bones dynamically (Solider uses mixamorig)
        const rightArm = nodes.mixamorigRightArm || nodes.RightArm; // Shoulder
        const rightForeArm = nodes.mixamorigRightForeArm || nodes.RightForeArm; // Elbow
        const head = nodes.mixamorigHead || nodes.Head;

        // Gestures when speaking
        if (isSpeaking) {
            // "Talk" with hand (Raise arm and wave forearm)
            if (rightArm) {
                // Approximate rotation values (Soldier T-Pose is base)
                // Add Math.sin to wiggle
                rightArm.rotation.z = -0.2 + Math.sin(t * 8) * 0.1;
                rightArm.rotation.x = 0.5 + Math.sin(t * 5) * 0.1;
            }
            if (rightForeArm) {
                rightForeArm.rotation.x = -1.5 + Math.sin(t * 10) * 0.3;
            }

            // Head Bob
            if (head) {
                head.rotation.x = Math.sin(t * 15) * 0.05;
                head.rotation.y = Math.sin(t * 4) * 0.1;
            }
        }
    });

    return (
        <group ref={group}>
            <primitive
                object={scene}
                position={[0, -1.6, 0]} // Stand on ground
                rotation={[0, 0, 0]} // Face forward
                scale={1.5}
            />
        </group>
    );
}

export function Avatar3DWrapper({ isSpeaking }: { isSpeaking: boolean }) {
    const [models, setModels] = useState<Array<{ name: string; url: string }>>([]);
    const [selected, setSelected] = useState<string>(DEFAULT_AVATAR_URL);

    useEffect(() => {
        // Load saved selection from localStorage
        try {
            const saved = localStorage.getItem('selectedAvatarModel');
            if (saved) setSelected(saved);
        } catch (e) {
            // ignore (SSR safety)
        }

        // Fetch available models from API
        fetch('/api/models')
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setModels(data);
                // Ensure selected exists; fallback to default
                const exists = Array.isArray(data) && data.find((m) => m.url === selected);
                if (!exists && data.length > 0 && selected === DEFAULT_AVATAR_URL) {
                    // keep default if user didn't choose
                }
            })
            .catch(() => {
                // noop - keep default
            });
    }, []);

    const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelected(val);
        try {
            localStorage.setItem('selectedAvatarModel', val);
        } catch (e) {
            // ignore
        }
    };

    return (
        <div className="w-full h-full min-h-[400px]">
            <div className="mb-2 flex items-center gap-3">
                <label className="text-sm text-gray-600">Modelo 3D:</label>
                <select
                    value={selected}
                    onChange={onChange}
                    className="px-2 py-1 border rounded-md bg-white text-sm"
                >
                    <option value={DEFAULT_AVATAR_URL}>Humano (por defecto)</option>
                    {models.map((m) => (
                        <option key={m.url} value={m.url}>{m.name}</option>
                    ))}
                </select>
            </div>

            <Canvas className="bg-transparent" camera={{ position: [0, 0.5, 3.5], fov: 45 }} gl={{ alpha: true }} dpr={[1, 2]}>

                <ambientLight intensity={1.8} />
                <directionalLight position={[0, 5, 5]} intensity={3} color="white" />
                <pointLight position={[-5, 5, -5]} intensity={2} color="#4444ff" />

                <AvatarErrorBoundary>
                    <AvatarModel isSpeaking={isSpeaking} modelUrl={selected} />
                </AvatarErrorBoundary>
            </Canvas>
        </div>
    );
}
