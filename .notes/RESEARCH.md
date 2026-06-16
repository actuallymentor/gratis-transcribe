# Research Notes

## PWA Share Target And Browser Transcription

- Android share-target support requires an installed PWA; the manifest `share_target` alone is not enough in a normal browser tab.
- Shared files require a `POST` share target with `multipart/form-data`; the service worker should intercept the POST, persist the file, then redirect with `303`.
- Include both MIME types and dot-prefixed extensions for audio accepts. Avoid MIME parameters in `accept`.
- Treat empty or generic shared-file MIME metadata leniently when the extension is a known WhatsApp/audio extension.
- Keep manifest audio accepts and share-target validator extension lists in sync.
- Whisper or Distil-Whisper through Transformers.js is the practical browser ASR baseline. Parakeet is the desired accuracy direction but needs a custom adapter/runtime validation before becoming default.
- Cache only the app shell during service-worker install. Use a user-triggered model download flow, browser Cache API/Transformers.js cache, storage quota checks, and a warm-up transcription before marking offline readiness.
- Font assets must be self-hosted and precached; runtime Google Fonts requests conflict with the offline/privacy requirements.
- Enforce self-hosted fonts with CSP where possible, and keep model-host exceptions in `connect-src`.
- Cloudflare Pages is suitable for the app shell, but ONNX model files can exceed the 25 MiB per-file asset limit. Use Hugging Face or Cloudflare R2 for larger model assets.
- Cloudflare Pages `_headers` and `_redirects` files must live under `public/` in this Vite app so they are copied into `dist`.
- Local Wrangler is not required because deployment uses `cloudflare/wrangler-action`; removing the local Wrangler dependency avoided audit issues from its transitive dependencies.
- Transcription cancellation must invalidate an active run token, and processing state should flip before async setup reads to prevent duplicate starts. Browser decode/model/transcribe work cannot always be hard-aborted, so every awaited boundary should ignore stale completions before updating IndexedDB or UI state.
- VitePWA can emit duplicate Workbox precache entries for public PWA icons when `globPatterns` also includes `png`; ignore those copied icon paths so `sw.js` evaluates and registers.
- Offline share redirects with `?share_id=` need a Workbox `NavigationRoute` bound to the precached `index.html`; query-sensitive runtime page caching is not enough.
- With VitePWA `registerType: "prompt"` and `injectManifest`, the custom service worker must handle `{ type: "SKIP_WAITING" }` messages so the visible update banner can activate a waiting worker.
- Transformers.js 4.2 initializes ONNX Runtime Web from `onnxruntime-web/webgpu`; unless `env.backends.onnx.wasm.wasmPaths` is set, ONNX Runtime defaults its WASM factory and binary URLs to jsDelivr. The app CSP does not allow external script CDNs, so self-host the `ort-wasm-simd-threaded.asyncify.mjs` and `.wasm` assets through Vite and point `wasmPaths` at those local URLs before creating ASR pipelines.
