# Transcribe Gratis Specification

## 1. Product Summary

Build `transcribe.gratis.sh` as a client-only progressive web app for Android. The app receives audio files shared from WhatsApp or any other Android app, transcribes them locally in the browser, and displays the text. Audio must never be uploaded to an API or server.

The primary use case is:

1. User installs the PWA from `https://transcribe.gratis.sh`.
2. User opens WhatsApp, long-presses an audio message, and uses Android share.
3. Android share sheet shows the installed PWA.
4. User shares the audio file to the PWA.
5. The PWA loads a locally cached speech-to-text model.
6. The PWA transcribes the audio on-device and shows copyable text.

The app must work offline after the app shell and selected model have been downloaded and verified.

## 2. Sources And Current Platform Facts

This spec is derived from `RAMBLE.md` plus current platform research.

Relevant facts:

- Web Share Target is a manifest feature for installed PWAs and is not available in every browser. Target Android Chrome/WebAPK first.
- Shared files require `share_target.method = "POST"`, `enctype = "multipart/form-data"`, and a `files` declaration.
- A service worker can intercept the share-target `POST`, store the file, and redirect the user to the app with a `303` response.
- Transformers.js supports browser ASR pipelines and WebGPU execution for Whisper-class ONNX models.
- Transformers.js can cache model files and ONNX Runtime WASM assets through the browser Cache API.
- ONNX Runtime WebGPU is available in current Chrome/Edge on Android.
- NVIDIA Parakeet is the preferred quality direction, but it is not a simple Transformers.js browser pipeline today. Parakeet should be implemented behind an adapter if viable; Whisper or Distil-Whisper must exist as the practical production baseline.
- Cloudflare Pages can deploy prebuilt static assets through Wrangler from GitHub Actions using `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`.
- Cloudflare Pages static assets have a 25 MiB per-file size limit, which is too small for many ONNX model weights. Large model files should be loaded from Hugging Face or a separate object store such as Cloudflare R2, not committed as Pages assets.

References:

- MDN `share_target`: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target
- web.dev receive shared files pattern: https://web.dev/patterns/files/receive-shared-files
- Transformers.js docs: https://huggingface.co/docs/transformers.js/en/index
- Transformers.js WebGPU guide: https://huggingface.co/docs/transformers.js/en/guides/webgpu
- Transformers.js environment/cache docs: https://huggingface.co/docs/transformers.js/en/api/env
- ONNX Runtime WebGPU docs: https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html
- NVIDIA Parakeet model card: https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3
- Transformers.js Parakeet support issue: https://github.com/huggingface/transformers.js/issues/1310
- Parakeet browser discussion: https://huggingface.co/nvidia/parakeet-tdt-0.6b-v2/discussions/56
- Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare Pages CI docs: https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/
- GitHub CLI `gh secret set`: https://cli.github.com/manual/gh_secret_set

## 3. Scope

### In Scope

- Android-installable PWA.
- Android share-target registration for audio files.
- Local browser transcription.
- Offline-capable app shell.
- Offline-capable model after first successful model download.
- Manual audio file picker fallback.
- Transcript display, copy, clear, retry, and new-file flows.
- Cloudflare Pages deployment.
- GitHub Actions deployment workflow.
- GitHub secret setup instructions/automation using `gh`.

### Out Of Scope

- Backend transcription.
- User accounts.
- Cloud transcript sync.
- Recording microphone audio in v1.
- iOS share-target support.
- Desktop browser share-target parity.
- Native Android wrapper or Play Store distribution.

## 4. Product Requirements

### Privacy

- The audio file must stay on the user's device.
- No transcription request may be sent to any external service.
- Network requests during transcription may only load app assets, WASM files, and model files.
- After offline readiness is verified, transcription must produce no network requests.
- The default retention policy is to keep only the latest transcript and delete source audio after transcription unless the user explicitly keeps it.

### Offline Behavior

- The app shell must load offline after the first visit.
- The selected ASR model must be cached for offline use after the user completes model setup.
- The UI must show a clear readiness state:
  - `Install required`
  - `Installed, model not downloaded`
  - `Downloading model`
  - `Offline ready`
  - `Offline unavailable: model missing`
- If the user shares audio while offline before the model is cached, the app must keep the shared file locally and explain that one online model download is required.

### Target Platform

- Primary: Android Chrome installed PWA.
- Secondary: Android Chromium-based browsers that create a real installed web app and register share targets.
- Browser page without installation is only an onboarding/install surface plus manual fallback; share-target behavior is not expected until installed.

## 5. Technical Stack

Use the existing project preferences unless a hard constraint prevents it.

- Runtime: Node.js 24 LTS.
- Language: JavaScript, not TypeScript.
- Bundler: Vite.
- UI: React in frontend-only mode.
- Routing: `react-router` `BrowserRouter`.
- PWA: `vite-plugin-pwa` with a custom service worker using Workbox `injectManifest`.
- State: `zustand` for shared app/model/share state.
- URL state: `use-query-params` where it helps preserve share IDs or selected panels.
- Styling: `styled-components`.
- Notifications: `react-hot-toast`.
- Utilities/logging: `mentie`; use `log` instead of `console`.
- ASR baseline: `@huggingface/transformers`.
- Inference runtime: `onnxruntime-web` through Transformers.js.
- IndexedDB helper: use a small dependency such as `idb`, or write a focused wrapper if the app only needs a few operations.
- Deployment: Cloudflare Pages, deployed by GitHub Actions with Wrangler.

The implementation should install the repository linting scaffold with:

```bash
curl -o- https://raw.githubusercontent.com/actuallymentor/airier/main/quickstart.sh | bash
```

## 6. Recommended Repository Structure

```text
.
|-- .github
|   `-- workflows
|       `-- deploy.yml
|-- public
|   |-- assets
|   |   |-- fonts
|   |   |-- icon-192.png
|   |   |-- icon-512.png
|   |   `-- maskable-512.png
|   |-- favicon.ico
|   |-- robots.txt
|   `-- samples
|       `-- silence-16k.wav
|-- src
|   |-- App.jsx
|   |-- components
|   |   |-- atoms
|   |   |-- molecules
|   |   `-- pages
|   |-- hooks
|   |-- index.css
|   |-- index.jsx
|   |-- modules
|   |   |-- audio
|   |   |   |-- decode_audio.js
|   |   |   |-- chunk_audio.js
|   |   |   `-- resample_audio.js
|   |   |-- asr
|   |   |   |-- asr_worker.js
|   |   |   |-- create_asr_adapter.js
|   |   |   |-- parakeet_adapter.js
|   |   |   `-- whisper_adapter.js
|   |   |-- model
|   |   |   `-- model_cache.js
|   |   |-- share
|   |   |   |-- share_db.js
|   |   |   `-- share_target.js
|   |   `-- storage
|   |       `-- app_db.js
|   |-- routes
|   |   `-- Routes.jsx
|   `-- stores
|       |-- model_store.js
|       |-- share_store.js
|       `-- transcript_store.js
|-- src-sw.js
|-- vite.config.js
|-- package.json
|-- package-lock.json
|-- .nvmrc
|-- _headers
`-- specification.md
```

## 7. Routes And Screens

### Routes

- `/`: install/onboarding page when not launched with a share; transcription workspace when installed.
- `/?share_id=<id>`: opens a shared file stored by the service worker.
- `/?share_error=<code>`: opens the app with a share-target error state, such as `no_audio`.
- `/share-target`: manifest share-target action; this route should never render directly because the service worker should intercept `POST` and redirect.
- `/settings`: model/storage/privacy settings.

### Uninstalled Browser Page

Show:

- App name: `Transcribe Gratis`.
- One-sentence purpose: transcribes shared audio messages locally on this device.
- Installation status.
- `Install App` pill/button using the `beforeinstallprompt` flow.
- Browser support hint if install prompt is unavailable: use Android Chrome and open the site directly.
- Manual file picker fallback for testing.

Do not show marketing copy, feature tours, or decorative content. This is a utility.

### Installed Idle Page

Show:

- Offline readiness badge.
- Selected model name and storage estimate.
- Primary action: choose audio file.
- Secondary action: model settings.
- If model is missing, show model download progress action.

### Shared Audio Page

State sequence:

1. `Receiving audio`
2. `Preparing audio`
3. `Loading model`
4. `Transcribing`
5. `Complete`

Requirements:

- Show file name/type/size when available.
- Show determinate progress when model download exposes bytes.
- Show transcription progress by chunk count when bytes are not available.
- Allow cancellation.
- Preserve a cancelled file until the user chooses `Clear`.

### Transcript Result

Show:

- Transcript text in a readable, selectable block.
- `Copy` action.
- `Share text` action using Web Share API when available.
- `Retry` action.
- `New audio` action.
- `Clear audio and transcript` action.

## 8. Manifest Requirements

The manifest must make the app installable and register it as an Android share target.

Example shape:

```json
{
  "name": "Transcribe Gratis",
  "short_name": "Transcribe",
  "description": "Local audio message transcription.",
  "id": "/",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#fafbfc",
  "theme_color": "#7ec0d0",
  "categories": [ "productivity", "utilities" ],
  "icons": [
    {
      "src": "/assets/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/assets/maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "share_target": {
    "action": "/share-target",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "audio",
          "accept": [
            "audio/*",
            "audio/ogg",
            "audio/opus",
            "audio/mpeg",
            "audio/mp4",
            "audio/aac",
            "audio/flac",
            "audio/amr",
            "audio/wav",
            "audio/webm",
            "video/3gpp",
            ".ogg",
            ".oga",
            ".opus",
            ".mp3",
            ".m4a",
            ".aac",
            ".flac",
            ".amr",
            ".wav",
            ".webm",
            ".3gp"
          ]
        }
      ]
    }
  }
}
```

The implementation may narrow accepted types after real Android/WhatsApp testing, but it must include `.ogg`, `.opus`, and `.amr`. Include both MIME types and dot-prefixed extensions because Android apps and operating-system share metadata can disagree. Do not include MIME parameters such as `audio/ogg; codecs=opus`; accept broad entries, then validate after receipt.

During development, reinstall the PWA or force a WebAPK update after changing `share_target`. Android Chrome can keep stale share-target registration until the WebAPK updates.

## 9. Service Worker Requirements

Use a custom service worker because a generated-only worker is not enough for share-target file capture.

Responsibilities:

- Precache app shell assets.
- Runtime-cache immutable static assets.
- Runtime-cache model files and ONNX Runtime WASM files.
- Intercept `POST /share-target`.
- Extract multipart form data.
- Validate incoming file type and size.
- Store the shared file in IndexedDB.
- Redirect to `/?share_id=<generated_id>` with status `303`.
- Notify existing clients about the new share if an app window is already open.

Share-target handling pseudocode:

```js
self.addEventListener( `fetch`, event => {

    const { request } = event
    const url = new URL( request.url )

    if( request.method === `POST` && url.pathname === `/share-target` ) {
        event.respondWith( receive_shared_audio( request ) )
        return
    }

} )

const receive_shared_audio = async request => {

    const form_data = await request.formData()
    const files = form_data.getAll( `audio` ).filter( value => value instanceof File )
    const [ file ] = files

    const redirect_to = path => Response.redirect( new URL( path, self.location.origin ).href, 303 )

    if( !file ) return redirect_to( `/?share_error=no_audio` )

    const share_id = crypto.randomUUID()

    await save_share_to_indexed_db( {
        share_id,
        file,
        name: file.name || ``,
        type: file.type || ``,
        size: file.size,
        title: form_data.get( `title` ) || ``,
        text: form_data.get( `text` ) || ``,
        url: form_data.get( `url` ) || ``,
        received_at: Date.now(),
        status: `received`
    } )

    return redirect_to( `/?share_id=${ encodeURIComponent( share_id ) }` )

}
```

Implementation detail: service workers can use IndexedDB. Keep the IDB code dependency-free inside the worker unless the bundler is configured to bundle the helper safely into `src-sw.js`.

## 10. IndexedDB Schema

Database name: `transcribe_gratis`.

Version: start at `1`.

Stores:

### `incoming_shares`

Key path: `share_id`.

Fields:

- `share_id`: UUID string.
- `file`: Blob/File.
- `name`: original file name if present.
- `type`: MIME type.
- `size`: byte size.
- `title`: shared title.
- `text`: shared text.
- `url`: shared URL.
- `received_at`: epoch milliseconds.
- `status`: `received | processing | complete | failed | cancelled`.
- `transcript_id`: nullable string.
- `error`: nullable string.

### `transcripts`

Key path: `transcript_id`.

Fields:

- `transcript_id`: UUID string.
- `share_id`: source share ID.
- `text`: final transcript.
- `segments`: array of `{ start_s, end_s, text }` when available.
- `model_id`: model used.
- `model_backend`: `webgpu | wasm`.
- `duration_s`: decoded audio duration.
- `created_at`: epoch milliseconds.

### `settings`

Key path: `key`.

Required keys:

- `selected_model_profile`
- `offline_ready`
- `delete_audio_after_transcription`
- `last_successful_model_check`

## 11. Audio Processing

The audio module must convert accepted files into the input format expected by the ASR adapter.

Pipeline:

1. Read shared `Blob` into an `ArrayBuffer`.
2. Decode and resample on the main thread with `AudioContext` or `OfflineAudioContext`.
3. Convert to mono by averaging channels.
4. Produce a transferable `Float32Array` at `16_000 Hz`.
5. Send the prepared audio buffer to the ASR worker.
6. Let the active ASR adapter own chunking and transcript merging.

Defaults:

- Sample rate: `16_000 Hz`.
- Whisper/Transformers.js chunk length: `30s`.
- Whisper/Transformers.js chunk overlap: `1s`.
- Maximum single file size for v1: `100 MB`.
- Maximum decoded duration for v1: `30 minutes`.

Do not chunk twice. When using the Transformers.js ASR pipeline, pass the full prepared mono buffer and configure pipeline chunking with `chunk_length_s` and `stride_length_s`. Only use manual pre-cut chunks for adapters that do not provide their own long-audio chunking.

If decoding fails:

- Show an actionable unsupported-format message.
- Keep the file so the user can retry after an app update.
- Do not silently upload or convert through a server.

WhatsApp Android voice messages are expected to be Ogg/Opus in common cases. Chrome Android should be the first tested browser for `.ogg` and `.opus`.

## 12. ASR Model Strategy

The app must use an adapter interface so model implementation can evolve without rewriting UI, storage, or share handling.

```js
/**
 * @typedef {Object} AsrAdapter
 * @property {string} model_id
 * @property {string} label
 * @property {() => Promise<void>} load
 * @property {(options: { audio: Float32Array, sample_rate: number, progress: Function }) => Promise<Object>} transcribe
 * @property {() => Promise<Object>} get_cache_status
 * @property {() => Promise<void>} warm
 */
```

### Baseline Adapter: Whisper Through Transformers.js

The baseline must be implemented because it is the most practical browser path today.

Recommended model profiles:

- `fast`: `onnx-community/whisper-base`, quantized where supported.
- `accurate`: `onnx-community/whisper-small` or a current Transformers.js-compatible Distil-Whisper model, quantized where supported and only selected automatically when storage quota and memory are sufficient.

Backend selection:

1. Prefer WebGPU when `navigator.gpu` is available and a smoke test succeeds.
2. Fall back to WASM.
3. If both fail, show an unsupported-device error.

Transformers.js setup requirements:

- Run ASR in a Web Worker.
- Use `pipeline( "automatic-speech-recognition", model_id, { device } )`.
- Pass the prepared audio buffer with `chunk_length_s` and `stride_length_s`; do not pre-chunk before calling this adapter.
- Use a progress callback to update model download state.
- Ensure `env.useBrowserCache = true`.
- Ensure `env.useWasmCache = true`.
- Use a stable `env.cacheKey`, for example `transcribe-gratis-transformers-v1`.
- Add a warm-up transcription against a tiny bundled audio file to verify cached model readiness.

### Preferred Future Adapter: Parakeet

Parakeet is desired for accuracy, but it must be treated as a separate adapter, not a model ID swap.

Observed constraints:

- `nvidia/parakeet-tdt-0.6b-v3` is a 600M parameter ASR model.
- The model card lists at least 2 GB RAM to load the model.
- A community ONNX conversion exists at `istupakov/parakeet-tdt-0.6b-v3-onnx`.
- The int8 Parakeet encoder file is roughly 652 MB by itself, before decoder/config/vocab overhead.
- Transformers.js has an open request for Parakeet support.
- A community browser Parakeet implementation exists, but should be validated before becoming default.

Implementation rule:

- If the implementer can make Parakeet run reliably in Android Chrome with WebGPU/WASM, add `parakeet_adapter.js`.
- Do not make Parakeet the default until it passes the acceptance tests on a real Android device.
- Keep Whisper as a fallback even if Parakeet works.

## 13. Model Caching And Offline Readiness

The app must not equate "installed" with "offline ready."

Offline readiness requires:

1. App shell is controlled by service worker.
2. Selected model files are present in Cache API or app-managed cache.
3. ONNX Runtime WASM files are cached.
4. A warm-up ASR call succeeds.
5. App stores `offline_ready = true` with selected model/version.

Model setup flow:

1. After installation, show `Download speech model`.
2. Request persistent storage with `navigator.storage.persist()` when available.
3. Estimate quota with `navigator.storage.estimate()`.
4. Select best model profile that fits:
   - Use `accurate` when quota and device memory are healthy.
   - Use `fast` when storage or memory is constrained.
5. Download/warm model with visible progress.
6. Run a tiny sample transcription.
7. Mark offline ready.

Cache invalidation:

- Model profile includes a version string.
- When model ID or dtype changes, mark old cache eligible for cleanup.
- Never delete the active model cache during a transcription.

Storage pressure:

- Provide a settings action to clear cached models.
- If the browser evicts the model, return to `Installed, model not downloaded`.

## 14. Network Policy

Allowed network requests:

- App assets from `transcribe.gratis.sh`.
- Model and WASM files from either:
  - self-hosted assets under `transcribe.gratis.sh/models/...` only when every file is within Cloudflare Pages' 25 MiB asset limit, or
  - a public Cloudflare R2 bucket/domain controlled by the project, or
  - Hugging Face model asset URLs during the initial model download.

Recommended production posture:

- Do not commit large ONNX model weights into the Pages app shell. Cloudflare Pages is appropriate for the app shell; Hugging Face or R2 is more appropriate for model assets over 25 MiB.
- If using Hugging Face URLs directly, pin exact model revisions, ensure CORS works, and verify cache behavior on Android Chrome.

Forbidden:

- Uploading audio.
- Uploading transcript unless the user uses a native share action.
- Analytics that include file names, transcript text, or audio metadata beyond coarse technical errors.

## 15. UI And Design Requirements

This is a quiet utility, not a landing page.

Use:

- Body background `#fafbfc`.
- Accent `#7ec0d0`.
- Montserrat Variable for headings, sourced from Google Fonts at build time and self-hosted under app assets.
- Nunito Variable for body, sourced from Google Fonts at build time and self-hosted under app assets.
- Touch targets at least `48dp` equivalent.
- Clear borders and readable contrast.
- Short, direct text.
- Persistent install pill on bottom-left when installable and not running standalone.

Fonts must be bundled, served from `transcribe.gratis.sh`, and precached with the app shell. The production app must not fetch `fonts.googleapis.com` or `fonts.gstatic.com` at runtime.

Avoid:

- Hero marketing layouts.
- Decorative gradients, blobs, or illustrations.
- Cards nested inside cards.
- Blue small text.
- Text that describes implementation details or keyboard shortcuts in the app UI.

Suggested copy:

- Install page title: `Transcribe Gratis`
- Install page body: `Install this app to transcribe shared audio messages locally on your phone.`
- Model setup CTA: `Download speech model`
- Ready badge: `Offline ready`
- Processing label: `Transcribing on this device`
- Privacy note near upload/file controls: `Audio stays on this device.`

## 16. Error Handling

Required error cases:

- Browser cannot install PWA.
- App is not installed, so share target is unavailable.
- Shared file is missing.
- Shared file is not audio.
- File is too large.
- Audio codec cannot be decoded.
- Model download fails.
- Storage quota is insufficient.
- WebGPU fails and WASM fallback is in use.
- No inference backend works.
- User goes offline before model setup completes.

Each error should include:

- Plain-language message.
- Retry action when useful.
- Clear action when the current file cannot be used.

## 17. Cloudflare Deployment

Cloudflare Pages project:

- Project name: `transcribe-gratis-sh`.
- Production domain: `transcribe.gratis.sh`.
- Production branch: `main`.
- Build command: `npm run build`.
- Output directory: `dist`.

Required files:

### `_headers`

Recommended baseline:

```text
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: microphone=(), camera=(), geolocation=()

/index.html
  Cache-Control: no-cache

/manifest.webmanifest
  Cache-Control: no-cache

/sw.js
  Cache-Control: no-cache

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/models/*
  Cache-Control: public, max-age=31536000, immutable
```

If threaded WASM or `SharedArrayBuffer` becomes necessary, evaluate adding cross-origin isolation headers. Only do this after confirming all model/WASM assets are served with compatible CORS/CORP behavior.

### GitHub Actions Workflow

`.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Setup Node
        uses: actions/setup-node@v6
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Install
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test -- --run

      - name: Build
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=transcribe-gratis-sh --branch=main
```

If no tests exist yet, create a real `npm test` script before enabling this exact workflow, or replace the test step with the project's actual test command.

### Secret Setup

The implementation agent should read `.env` locally and set GitHub Actions secrets with `gh`. Do not commit `.env`.

Expected `.env` keys:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN` preferred
- `CLOUDFLARE_API_KEY` acceptable only if it is the credential Wrangler can use as `apiToken`

Commands:

```bash
set -a
. ./.env
set +a

printf %s "$CLOUDFLARE_ACCOUNT_ID" | gh secret set CLOUDFLARE_ACCOUNT_ID
printf %s "${CLOUDFLARE_API_TOKEN:-$CLOUDFLARE_API_KEY}" | gh secret set CLOUDFLARE_API_TOKEN

gh secret list
```

The implementation should verify the secrets exist before relying on CI. The Cloudflare token should have Cloudflare Pages edit permission for the target account.

## 18. Testing Requirements

### Unit Tests

Cover:

- Share-target form parsing.
- File validation.
- IndexedDB share save/load/delete.
- Audio mono conversion.
- Audio resampling.
- Chunking and transcript merging.
- Model profile selection from storage/device capability inputs.
- Offline readiness state transitions.

### Integration Tests

Cover:

- Service worker `POST /share-target` flow with synthetic multipart audio.
- Redirect to `/?share_id=...`.
- App loads stored share and starts transcription.
- Offline app shell load.
- Cache-miss and cache-hit model states.

### Browser/E2E Tests

Use Playwright for:

- Install page rendering.
- Manual file picker flow with a bundled small audio sample.
- Copy transcript action.
- Offline page reload after first load.

### Manual Android Acceptance Tests

Run on a real Android phone with Chrome:

1. Visit `https://transcribe.gratis.sh`.
2. Install the PWA.
3. Confirm app icon appears as an installed app.
4. Complete model download.
5. Turn on airplane mode.
6. Open the PWA and confirm it loads.
7. Open WhatsApp and share an audio message to the PWA.
8. Confirm the PWA receives the file while offline.
9. Confirm transcription completes without network.
10. Confirm copy action works.
11. Clear transcript/audio and confirm storage is reduced.

## 19. Acceptance Criteria

The implementation is complete when:

- The app can be installed from Android Chrome.
- The installed app appears in Android's share sheet for WhatsApp audio.
- Sharing a WhatsApp audio file opens the app to a transcription workflow.
- Transcription runs locally in the browser.
- No audio upload occurs.
- A first online setup downloads and verifies the selected speech model.
- After setup, the app can receive and transcribe audio offline.
- The transcript can be copied.
- The app provides a manual file picker fallback.
- The app deploys to Cloudflare Pages through GitHub Actions on push to `main`.
- Cloudflare secrets are present in GitHub Actions secrets.
- Tests cover the service worker share route, storage, audio preparation, and core UI states.

## 20. Implementation Order

Recommended sequence for the implementation LM:

1. Scaffold Vite React app with Node 24, airier, PWA plugin, and preferred libraries.
2. Add manifest, icons, install prompt, and offline app shell.
3. Add custom service worker and `POST /share-target` capture.
4. Add IndexedDB storage for shared files.
5. Add manual file picker and route handling for `share_id`.
6. Add audio decode/resample/chunk modules.
7. Add ASR worker with Whisper adapter.
8. Add model cache/readiness flow.
9. Add transcript UI and actions.
10. Add tests.
11. Add Cloudflare headers and deploy workflow.
12. Configure GitHub secrets with `gh`.
13. Deploy and run Android manual acceptance tests.
14. Experiment with Parakeet adapter only after the baseline is working.

## 21. Open Decisions

These can be resolved by implementation testing without blocking v1:

- Whether `whisper-base`, `whisper-small`, or a Parakeet adapter is the best default on the owner's Android device.
- Whether small model files should be self-hosted on Cloudflare Pages, and whether larger files should be loaded from Hugging Face or R2 and cached.
- Whether to include `ffmpeg.wasm` later for rare audio codecs unsupported by Chrome Android.
- Whether to store transcript history beyond the latest transcript.
