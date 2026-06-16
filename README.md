# Transcribe Gratis

Installable Android PWA for local audio message transcription. The app receives shared audio files, stores them locally, runs browser-side Whisper transcription, and keeps transcripts on device.

## Local Development

```bash
nvm use
npm ci
npm run dev
```

## Checks

```bash
npm run lint
npm test
npm run build
```

## Deployment

Push to `main` deploys `dist` to Cloudflare Pages with GitHub Actions. Required repository secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

The app shell is served from Cloudflare Pages. Large model assets are loaded from Hugging Face or an external model host and cached by the browser for offline use.
