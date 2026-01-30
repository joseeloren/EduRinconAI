'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Float, OrthographicCamera } from '@react-three/drei';
import { Vector3, Euler } from 'three';

// URL de un avatar por defecto de Ready Player Me
const DEFAULT_AVATAR_URL = 'https://models.readyplayer.me/642144dd5294524c5625488e.glb'; // Modelo mas fiable

interface Avatar3DProps {
    isSpeaking: boolean;
    modelUrl?: string;
}

function AvatarModel({ isSpeaking, modelUrl = DEFAULT_AVATAR_URL }: Avatar3DProps) {
    const { scene, nodes } = useGLTF(modelUrl);
    const headRef = useRef<any>(null);
    const jawRef = useRef<any>(null);

    // Configurar referencias a los huesos una vez cargado
    useEffect(() => {
        // Recorrer la escena para encontrar la cabeza y la mandíbula
        // Los nombres de los huesos varían, pero en RPM suelen ser 'Head' y 'Wolf3D_Head' o similar.
        // Haremos una búsqueda básica.
        scene.traverse((object: any) => {
            if (object.isBone) {
                if (object.name.includes('Head')) headRef.current = object;
                // Para la mandíbula, a veces es un morph target en el mesh, no un hueso.
                // Ready Player Me usa Morph Targets en el mesh 'Wolf3D_Head' normalmente.
            }
        });
    }, [scene]);

    useFrame((state) => {
        if (!headRef.current) return;

        // Movimiento suave de "respiración" / idle
        const t = state.clock.getElapsedTime();
        headRef.current.rotation.y = Math.sin(t / 2) * 0.1;
        headRef.current.rotation.x = Math.sin(t / 1.5) * 0.05;

        // Simulación de hablar (movimiento de mandíbula/cabeza más rápido)
        if (isSpeaking) {
            // "Vibrar" la escala o rotación pequeña para simular habla
            headRef.current.rotation.x += Math.sin(t * 15) * 0.02;

            // Si tuviéramos acceso a MorphTargets (visemes), los usaríamos aquí.
            // Como fallback genérico, movemos ligeramente la cabeza verticalmente
            headRef.current.position.y += Math.sin(t * 20) * 0.002;
        } else {
            // Reset suave si fuera necesario
        }
    });

    return (
        <primitive
            object={scene}
            position={[0, -1.5, 0]}
            scale={[1.4, 1.4, 1.4]}
            rotation={[0.1, 0, 0]}
        />
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

                <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                    <AvatarModel isSpeaking={isSpeaking} />
                </Float>

                <Environment preset="city" />
            </Canvas>
        </div>
    );
}
