'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <h2>Error Global</h2>
                    <p>Algo salió mal. Por favor, intenta de nuevo.</p>
                    <button onClick={() => reset()}>Reintentar</button>
                </div>
            </body>
        </html>
    );
}
