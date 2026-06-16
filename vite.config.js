import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const audio_accept = [
    `audio/*`,
    `audio/ogg`,
    `audio/opus`,
    `audio/mpeg`,
    `audio/mp4`,
    `audio/aac`,
    `audio/flac`,
    `audio/amr`,
    `audio/wav`,
    `audio/webm`,
    `video/3gpp`,
    `.ogg`,
    `.oga`,
    `.opus`,
    `.mp3`,
    `.m4a`,
    `.aac`,
    `.flac`,
    `.amr`,
    `.wav`,
    `.webm`,
    `.3gp`
]

export default defineConfig( {
    plugins: [
        react(),
        VitePWA( {
            strategies: `injectManifest`,
            srcDir: `src`,
            filename: `sw.js`,
            registerType: `prompt`,
            injectManifest: {
                globPatterns: [ `**/*.{html,js,mjs,css,png,svg,ico,wav,woff2,webmanifest}` ],
                globIgnores: [ `assets/icon-192.png`, `assets/icon-512.png`, `assets/maskable-512.png` ],
                maximumFileSizeToCacheInBytes: 10 * 1_024 * 1_024
            },
            devOptions: {
                enabled: true,
                type: `module`
            },
            manifest: {
                name: `Transcribe Gratis`,
                short_name: `Transcribe`,
                description: `Local audio message transcription.`,
                id: `/`,
                start_url: `/`,
                scope: `/`,
                display: `standalone`,
                background_color: `#fafbfc`,
                theme_color: `#7ec0d0`,
                categories: [ `productivity`, `utilities` ],
                icons: [
                    {
                        src: `/assets/icon-192.png`,
                        sizes: `192x192`,
                        type: `image/png`
                    },
                    {
                        src: `/assets/icon-512.png`,
                        sizes: `512x512`,
                        type: `image/png`
                    },
                    {
                        src: `/assets/maskable-512.png`,
                        sizes: `512x512`,
                        type: `image/png`,
                        purpose: `maskable`
                    }
                ],
                share_target: {
                    action: `/share-target`,
                    method: `POST`,
                    enctype: `multipart/form-data`,
                    params: {
                        title: `title`,
                        text: `text`,
                        url: `url`,
                        files: [
                            {
                                name: `audio`,
                                accept: audio_accept
                            }
                        ]
                    }
                }
            }
        } )
    ],
    test: {
        environment: `jsdom`,
        setupFiles: [ `./src/test/setup.js` ],
        include: [ `src/**/*.test.js`, `src/**/*.test.jsx` ]
    },
    worker: {
        format: `es`
    }
} )
