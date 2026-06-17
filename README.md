# Transcribe Gratis

Installable Android PWA for local audio message transcription. The app receives shared audio files, stores them locally, runs browser-side Whisper transcription, and keeps transcripts on device.

The model panel checks browser runtime support before setup, including WebGPU acceleration, WASM fallback support, local storage, model caching, and audio decode APIs.

## Local Development

```bash
nvm use
npm ci
npm run dev
```

## Checks

```bash
npm run lint
npm run lint:check
npm test
npm run build
npm run test:e2e
npm run test:e2e:real
```

`npm run test:e2e` includes the real browser model load and transcription path. Use `npm run test:e2e:real` to run only that network-dependent check.

## Deployment

Push to `main` deploys `dist` to Cloudflare Pages with GitHub Actions. Required repository secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

The app shell is served from Cloudflare Pages. Large model assets are loaded from Hugging Face or an external model host and cached by the browser for offline use.
