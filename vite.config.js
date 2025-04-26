import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
// import { VitePWA } from 'vite-plugin-pwa'
import path from 'path';
export default defineConfig({
    plugins: [
        react(),
        // VitePWA({
        //   registerType: 'autoUpdate',
        //   manifest: {
        //     name: 'Once You',
        //     short_name: 'Once You',
        //     start_url: '/',
        //     display: 'standalone',
        //     background_color: '#141414',
        //     theme_color: '#141414',
        //     icons: [
        //       {
        //         src: 'public/192.svg',
        //         sizes: '192x192',
        //         type: 'image/svg+xml'
        //       },
        //       {
        //         src: 'public/512.svg',
        //         sizes: '512x512',
        //         type: 'image/svg+xml'
        //       }
        //     ]
        //   }
        // }),
    ],
    resolve: {
        alias: [
            { find: '@', replacement: path.resolve(__dirname, 'src') },
            { find: '@components', replacement: path.resolve(__dirname, 'src/components') },
            { find: '@assets', replacement: path.resolve(__dirname, 'src/assets') },
            { find: '@utils', replacement: path.resolve(__dirname, 'src/utils') }
        ],
    },
    assetsInclude: ['**/*.mp3'],
});
