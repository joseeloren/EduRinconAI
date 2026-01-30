import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const dir = path.join(process.cwd(), 'public', 'models');
        const files = await fs.promises.readdir(dir);
        const models = files
            .filter((f) => f.endsWith('.glb') || f.endsWith('.gltf'))
            .map((f) => ({ name: f, url: `/models/${f}` }));

        return NextResponse.json(models);
    } catch (err) {
        console.error('Error reading models directory', err);
        return NextResponse.json([], { status: 200 });
    }
}
