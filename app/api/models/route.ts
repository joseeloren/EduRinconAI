import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const FRIENDLY_NAMES: Record<string, string> = {
    'CesiumMan.glb': 'Humano (CesiumMan)',
    'RiggedFigure.glb': 'Figura articulada',
    'RiggedSimple.glb': 'Figura simple',
    'BrainStem.glb': 'BrainStem (avatar)',
    'astronaut.glb': 'Astronauta',
    'teacher.glb': 'Profesor',
};

function getFriendlyName(filename: string): string {
    return FRIENDLY_NAMES[filename] ?? filename.replace(/\.(glb|gltf)$/i, '');
}

export async function GET() {
    try {
        const dir = path.join(process.cwd(), 'public', 'models');
        const files = await fs.promises.readdir(dir);
        const models = files
            .filter((f) => f.endsWith('.glb') || f.endsWith('.gltf'))
            .map((f) => ({ name: getFriendlyName(f), url: `/models/${f}` }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json(models);
    } catch (err) {
        console.error('Error reading models directory', err);
        return NextResponse.json([], { status: 200 });
    }
}
