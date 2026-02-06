/**
 * OpenAI-Compatible API Server
 * 
 * Exposes OpenAI-compatible endpoints on port 8000 that proxy to Ollama/LM Studio/vLLM.
 * Supports: /v1/models, /v1/chat/completions, /health
 */

import http from 'http';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const PORT = parseInt(process.env.API_SERVER_PORT || '8000', 10);
const UPSTREAM_URL = process.env.LLM_API_BASE_URL || 'http://localhost:11434/v1';
const API_KEY = process.env.LLM_API_KEY || 'ollama';  // Ollama no requiere API key real
const DEFAULT_MODEL = process.env.LLM_MODEL_NAME || 'llama3.2';

// Ensure upstream URL ends with /v1
const getUpstreamBase = () => {
    let url = UPSTREAM_URL;
    if (!url.endsWith('/v1')) {
        url = url.replace(/\/+$/, '') + '/v1';
    }
    return url;
};

const UPSTREAM_BASE = getUpstreamBase();

console.log(`[API Server] Starting with config:`);
console.log(`  - Port: ${PORT}`);
console.log(`  - Upstream: ${UPSTREAM_BASE}`);
console.log(`  - Default Model: ${DEFAULT_MODEL}`);

/**
 * Parse JSON body from request
 */
async function parseBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

/**
 * Send JSON response
 */
function sendJson(res: http.ServerResponse, status: number, data: any) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

/**
 * Handle /v1/models - List available models
 */
async function handleModels(req: http.IncomingMessage, res: http.ServerResponse) {
    try {
        const response = await fetch(`${UPSTREAM_BASE}/models`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        
        if (!response.ok) {
            // Fallback: return default model if upstream fails
            sendJson(res, 200, {
                object: 'list',
                data: [{
                    id: DEFAULT_MODEL,
                    object: 'model',
                    created: Date.now(),
                    owned_by: 'local'
                }]
            });
            return;
        }
        
        const data = await response.json();
        sendJson(res, 200, data);
    } catch (error) {
        console.error('[API Server] Models error:', error);
        // Fallback response
        sendJson(res, 200, {
            object: 'list',
            data: [{
                id: DEFAULT_MODEL,
                object: 'model',
                created: Date.now(),
                owned_by: 'local'
            }]
        });
    }
}

/**
 * Handle /v1/chat/completions - Chat completions (streaming and non-streaming)
 */
async function handleChatCompletions(req: http.IncomingMessage, res: http.ServerResponse) {
    try {
        const body = await parseBody(req);
        
        // Use default model if not specified
        if (!body.model) {
            body.model = DEFAULT_MODEL;
        }
        
        const isStreaming = body.stream === true;
        
        console.log(`[API Server] Chat completion - Model: ${body.model}, Stream: ${isStreaming}`);
        
        const upstreamResponse = await fetch(`${UPSTREAM_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(body)
        });
        
        if (!upstreamResponse.ok) {
            const errorText = await upstreamResponse.text();
            console.error('[API Server] Upstream error:', upstreamResponse.status, errorText);
            sendJson(res, upstreamResponse.status, {
                error: {
                    message: errorText,
                    type: 'upstream_error',
                    code: upstreamResponse.status
                }
            });
            return;
        }
        
        if (isStreaming) {
            // Streaming response - forward SSE
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            });
            
            const reader = upstreamResponse.body?.getReader();
            if (!reader) {
                res.end();
                return;
            }
            
            const decoder = new TextDecoder();
            
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value, { stream: true });
                    res.write(chunk);
                }
            } catch (streamError) {
                console.error('[API Server] Stream error:', streamError);
            } finally {
                res.end();
            }
        } else {
            // Non-streaming response
            const data = await upstreamResponse.json();
            sendJson(res, 200, data);
        }
    } catch (error) {
        console.error('[API Server] Chat completion error:', error);
        sendJson(res, 500, {
            error: {
                message: error instanceof Error ? error.message : 'Internal server error',
                type: 'server_error',
                code: 500
            }
        });
    }
}

/**
 * Handle /health - Health check endpoint
 */
function handleHealth(req: http.IncomingMessage, res: http.ServerResponse) {
    sendJson(res, 200, {
        status: 'ok',
        upstream: UPSTREAM_BASE,
        defaultModel: DEFAULT_MODEL
    });
}

/**
 * CORS preflight handler
 */
function handleCors(res: http.ServerResponse) {
    res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
    });
    res.end();
}

/**
 * Main request handler
 */
const server = http.createServer(async (req, res) => {
    // Add CORS headers to all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const url = req.url || '/';
    const method = req.method || 'GET';
    
    console.log(`[API Server] ${method} ${url}`);
    
    // Handle CORS preflight
    if (method === 'OPTIONS') {
        handleCors(res);
        return;
    }
    
    try {
        // Route requests
        if (url === '/health' && method === 'GET') {
            handleHealth(req, res);
        } else if (url === '/v1/models' && method === 'GET') {
            await handleModels(req, res);
        } else if (url === '/v1/chat/completions' && method === 'POST') {
            await handleChatCompletions(req, res);
        } else {
            sendJson(res, 404, {
                error: {
                    message: `Endpoint not found: ${method} ${url}`,
                    type: 'not_found',
                    code: 404
                }
            });
        }
    } catch (error) {
        console.error('[API Server] Unhandled error:', error);
        sendJson(res, 500, {
            error: {
                message: 'Internal server error',
                type: 'server_error',
                code: 500
            }
        });
    }
});

server.listen(PORT, () => {
    console.log(`\n[API Server] ✅ OpenAI-compatible API running on http://localhost:${PORT}`);
    console.log(`[API Server] Endpoints:`);
    console.log(`  - GET  /health`);
    console.log(`  - GET  /v1/models`);
    console.log(`  - POST /v1/chat/completions`);
    console.log(`\n[API Server] Waiting for requests...\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[API Server] Shutting down...');
    server.close(() => process.exit(0));
});
