# Research Notes

## PWA Share Target And Browser Transcription

- Android share-target support requires an installed PWA; the manifest `share_target` alone is not enough in a normal browser tab.
- Shared files require a `POST` share target with `multipart/form-data`; the service worker should intercept the POST, persist the file, then redirect with `303`.
- Include both MIME types and dot-prefixed extensions for audio accepts. Avoid MIME parameters in `accept`.
- Android file managers can share `.opus` files as `application/octet-stream` or `application/ogg`; include those MIME types in the manifest share-target accept list, then rely on extension-aware validation to reject non-audio generic binary shares.
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
- Local browser ASR support should treat WebGPU as optional acceleration and WASM as the required fallback path. Required checks are secure context, workers, WebAssembly, WASM SIMD, IndexedDB, Cache API, and browser audio decode support.
- Real model e2e coverage should force the `Whisper Base` profile through the app UI before downloading. Auto-selected `Whisper Small` can work but made the full Playwright suite spend 7 minutes waiting for offline readiness in this container.
- Keep `env.useWasmCache` disabled while the production CSP omits `blob:` from `script-src`. Transformers.js preloads ONNX Runtime's WASM factory as a blob module when that cache is enabled; the strict CSP blocks that dynamic import in production. The service worker/runtime asset caches cover the self-hosted `.mjs` and `.wasm` URLs instead.
- A user-triggered `Update app` command should unregister active service workers and clear app-shell/runtime caches, but it should not clear model caches or IndexedDB transcripts. This helps stale PWA code, not Android native share-sheet registration.
- Probe a same-origin path that the service worker does not handle before deleting app-shell caches; otherwise an offline user can remove their only working installed shell and reload into a browser error.
- Android share-sheet registration for an installed PWA is controlled by Chrome's WebAPK/manifest update flow. If share-target support was added after install, the native target may require Chrome to update the WebAPK on a stable connection or a manual PWA reinstall. Chrome's `about://webapks` can manually schedule an update for debugging, but app JavaScript cannot invoke that internal browser page/update flow.
