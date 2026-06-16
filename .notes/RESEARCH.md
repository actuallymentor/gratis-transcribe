# Research Notes

## PWA Share Target And Browser Transcription

- Android share-target support requires an installed PWA; the manifest `share_target` alone is not enough in a normal browser tab.
- Shared files require a `POST` share target with `multipart/form-data`; the service worker should intercept the POST, persist the file, then redirect with `303`.
- Include both MIME types and dot-prefixed extensions for audio accepts. Avoid MIME parameters in `accept`.
- Treat empty or generic shared-file MIME metadata leniently when the extension is a known WhatsApp/audio extension.
- Whisper or Distil-Whisper through Transformers.js is the practical browser ASR baseline. Parakeet is the desired accuracy direction but needs a custom adapter/runtime validation before becoming default.
- Cache only the app shell during service-worker install. Use a user-triggered model download flow, browser Cache API/Transformers.js cache, storage quota checks, and a warm-up transcription before marking offline readiness.
- Font assets must be self-hosted and precached; runtime Google Fonts requests conflict with the offline/privacy requirements.
- Enforce self-hosted fonts with CSP where possible, and keep model-host exceptions in `connect-src`.
- Cloudflare Pages is suitable for the app shell, but ONNX model files can exceed the 25 MiB per-file asset limit. Use Hugging Face or Cloudflare R2 for larger model assets.
