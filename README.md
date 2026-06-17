# Transcribe Gratis

Installable Android PWA for local audio message transcription. The app receives shared audio files, stores them locally, runs browser-side Whisper transcription, and keeps transcripts on device.

The model panel checks browser runtime support before setup, including WebGPU acceleration, WASM fallback support, local storage, model caching, and audio decode APIs.

## App Updates

Settings includes an `Update app` command. It checks that the app origin is reachable, unregisters active service workers, clears app-shell and WASM runtime caches, and reloads the page so the current service worker installs again. It preserves downloaded speech models, source audio, and transcripts. The next transcription after an app update may need connectivity to re-cache the WASM runtime.

On Android, the native share-sheet target is registered by Chrome's installed WebAPK from the web app manifest. If the PWA was installed before share-target support changed, `Update app` can refresh the web app and service worker, but Chrome may still need to update the WebAPK on a stable connection or the user may need to remove and reinstall the PWA before Android shows it as a native share target. For debugging, Chrome exposes WebAPK status and a manual update request at `about://webapks`, but installed web apps cannot open or trigger that internal update flow themselves.

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
