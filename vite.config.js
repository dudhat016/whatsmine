import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
        host: '0.0.0.0',
        hmr: {
            host: '127.0.0.1',
        },
        watch: {
            usePolling: true,
            interval: 1000,
            ignored: ['**/vendor/**', '**/storage/**', '**/.git/**', '**/public/build/**'],
        },
    },
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
});
