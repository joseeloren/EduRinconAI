import dotenv from 'dotenv';
import * as undici from 'undici';

dotenv.config({ path: '.env.local' });

const baseURL = process.env.LLM_API_BASE_URL || 'http://localhost:1234/v1';
const modelName = process.env.LLM_MODEL_NAME || 'mistral-small';
const embeddingModelName = process.env.LLM_EMBEDDING_MODEL || 'text-embedding-nomic-embed-text-v1.5';
const apiKey = process.env.LLM_API_KEY || 'lm-studio';

async function diagnose() {
    console.log('--- LM Studio Diagnostics ---');
    console.log(`Base URL: ${baseURL}`);
    console.log(`Target Model: ${modelName}`);
    console.log(`API Key: ${apiKey ? 'Set' : 'Not Set'}`);

    try {
        console.log('\n1. Checking connectivity to /v1/models...');
        const modelsRes = await undici.fetch(`${baseURL}/models`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!modelsRes.ok) {
            console.error(`Error fetching models: ${modelsRes.status} ${modelsRes.statusText}`);
            const text = await modelsRes.text();
            console.error('Response:', text);
        } else {
            const data = await modelsRes.json() as any;
            console.log('Successfully connected!');
            const loadedModels = data.data?.map((m: any) => m.id) || [];
            console.log('Loaded models in LM Studio:', loadedModels);
            
            if (loadedModels.includes(modelName)) {
                console.log(`✅ Chat Model "${modelName}" is loaded and ready.`);
            } else {
                console.warn(`⚠️ Chat Model "${modelName}" is NOT in the loaded list.`);
                console.log(`   Available: ${loadedModels.join(', ')}`);
            }

            if (loadedModels.includes(embeddingModelName)) {
                console.log(`✅ Embedding Model "${embeddingModelName}" is loaded and ready.`);
            } else {
                console.warn(`⚠️ Embedding Model "${embeddingModelName}" is NOT in the loaded list.`);
                console.log(`   Target: ${embeddingModelName}`);
                console.log('   TIP: En LM Studio, el nombre debe ser EXACTO (incluyendo @q8_0 si procede).');
            }
        }

        console.log('\n2. Testing dummy chat completion...');
        const chatRes = await undici.fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelName,
                messages: [{ role: 'user', content: 'Say "hello"' }],
                max_tokens: 10
            })
        });

        if (!chatRes.ok) {
            console.error(`Chat test failed: ${chatRes.status} ${chatRes.statusText}`);
            const text = await chatRes.text();
            console.error('Response:', text);
        } else {
            console.log('✅ Chat completion test successful!');
        }

    } catch (err) {
        console.error('\n❌ Connection Error:');
        console.error(err);
        if (err instanceof Error && err.message.includes('ECONNREFUSED')) {
            console.log('\nTIP: Asegúrate de que LM Studio esté abierto y el servidor API activo (Local Server tab).');
        }
    }
}

diagnose();
