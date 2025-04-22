import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: [
            { find: '@', replacement: path.resolve(__dirname, 'src') },
            { find: '@components', replacement: path.resolve(__dirname, 'src/components') },
            { find: '@assets', replacement: path.resolve(__dirname, 'src/assets') },
            { find: '@utils', replacement: path.resolve(__dirname, 'src/utils') }
        ],
    },
});
