import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="container flex flex-col items-center justify-center min-h-screen py-8">
            <div className="text-center space-y-6 max-w-md">
                <h1 className="text-6xl font-bold text-primary">404</h1>
                <h2 className="text-3xl font-semibold">Página no encontrada</h2>
                <p className="text-muted-foreground">
                    Lo sentimos, la página que buscas no existe o ha sido movida.
                </p>
                <div className="pt-4">
                    <Link href="/">
                        <Button>Volver al inicio</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
