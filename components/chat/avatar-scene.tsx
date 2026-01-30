'use client';

import React, { useRef, useEffect, useState, useMemo, Component, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { AnimationClip, Object3D } from 'three';

interface Avatar3DProps {
    isSpeaking: boolean;
    modelUrl?: string;
}

/** Filtra las animaciones para incluir solo tracks cuyos nodos existen en la escena, evitando warnings de PropertyBinding */
function filterAnimationsToMatchScene(clips: AnimationClip[], scene: Object3D): AnimationClip[] {
    const nodeNames = new Set<string>();
    scene.traverse((obj) => {
        if (obj.name) nodeNames.add(obj.name);
    });

    return clips
        .map((clip) => {
            const validTracks = clip.tracks.filter((track) => {
                const path = track.name.split('.')[0];
                const nodeName = path.includes('/') ? path.split('/').pop()! : path;
                return nodeNames.has(nodeName);
            });
            if (validTracks.length === 0) return null;
            return new AnimationClip(clip.name, clip.duration, validTracks);
        })
        .filter((c): c is AnimationClip => c !== null);
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

        // Find bones dynamically (Solider uses mixamorig)
        const rightArm = nodes.mixamorigRightArm || nodes.RightArm; // Shoulder
        const rightForeArm = nodes.mixamorigRightForeArm || nodes.RightForeArm; // Elbow
        const head = nodes.mixamorigHead || nodes.Head;

        // Gestures when speaking
        if (isSpeaking) {
            // "Talk" with hand (Raise arm and wave forearm)
            if (rightArm) {
                // More natural position: Arm down by side but slightly forward
                // z: -1.4 (down), x: 0.3 (forward), y: -0.2 (slight twist in)
                rightArm.rotation.z = -1.4 + Math.sin(t * 8) * 0.05;
                rightArm.rotation.x = 0.3 + Math.sin(t * 5) * 0.05;
                // Force Y to avoid weird twists from existing animations
                rightArm.rotation.y = -0.2;
            }
            if (rightForeArm) {
                // Bend elbow (hand up)
                rightForeArm.rotation.x = -1.8 + Math.sin(t * 10) * 0.2;
                // Ensure forearm doesn't twist weirdly
                rightForeArm.rotation.y = 0;
                rightForeArm.rotation.z = 0;
            }

            // Head Bob
            if (head) {
                head.rotation.x = Math.sin(t * 15) * 0.02; // reduced bob
                head.rotation.y = Math.sin(t * 4) * 0.05;
            }
        }
    });

    return (
        <group ref={group}>
            <primitive
                object={scene}
                position={[0, -1.6, 0]} // Stand on ground
                rotation={[0, modelUrl.includes('Soldier.glb') ? Math.PI : 0, 0]} // Face forward (Soldier needs 180deg)
                scale={1.5}
            />
        </group>
    );
}

export function Avatar3DWrapper({ isSpeaking }: { isSpeaking: boolean }) {
    const [models, setModels] = useState<Array<{ name: string; url: string }>>([]);
    const [selected, setSelected] = useState<string>(DEFAULT_AVATAR_URL);

    useEffect(() => {
        // Load saved selection from localStorage on mount
        try {
            const saved = localStorage.getItem('selectedAvatarModel');
            if (saved) setSelected(saved);
        } catch (e) {
            // ignore (SSR safety)
        }
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
                            try {
                                localStorage.setItem('selectedAvatarModel', DEFAULT_AVATAR_URL);
                            } catch {
                                /* ignore */
                            }
                            return DEFAULT_AVATAR_URL;
                        }
                        return prev;
                    });
                }
            })
            .catch((err) => {
                console.error('Failed to load models:', err);
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

    const options = models.length > 0
        ? models
        : [{ name: 'Humano (por defecto)', url: DEFAULT_AVATAR_URL }];

    return (
        <div className="w-full h-full min-h-[400px] flex flex-col">
            <div className="mb-2 flex items-center gap-3 pointer-events-auto relative z-20">
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
            </div>

            <Canvas className="flex-1 bg-transparent" camera={{ position: [0, 0.2, 5.5], fov: 45 }} gl={{ alpha: true }} dpr={[1, 2]}>

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
