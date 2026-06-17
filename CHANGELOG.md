# Changelog

## [0.2.0] - 2026-06-17

### Added

- Add browser ASR runtime support diagnostics before model setup.
- Add real Whisper Base Playwright transcription coverage with spoken audio.
- Add a focused `npm run test:e2e:real` command.

### Changed

- Probe WebGPU adapters before choosing the model backend.
- Fail model setup and transcription early when required browser APIs are missing.

## [0.1.2] - 2026-06-16

### Fixed

- Show the PWA for Android `.opus` shares with generic MIME metadata.

## [0.1.1] - 2026-06-16

### Fixed

- Self-host ONNX Runtime Web assets for browser model downloads.
- Cache the emitted ONNX runtime module for offline backend startup.

## [0.1.0] - 2026-06-16

### Added

- Add implementation specification for the local audio transcription PWA.
- Implement the installable React PWA with Android audio share-target support.
- Add local IndexedDB storage for shared audio, transcripts, and settings.
- Add a Transformers.js Whisper worker with offline model setup flow.
- Add Cloudflare Pages deployment workflow and GitHub secret configuration.
- Add generated PWA icons, a silent audio sample, unit tests, and Playwright smoke test.
- Add stale-run and duplicate-start guards for transcription processing.
- Add an offline shared-URL Playwright regression and model-cache unit coverage.

### Changed

- Clarify offline fonts, share metadata, ASR chunking, and CI versions.
- Define share error codes, font bundling, audio decode limits, and CSP.
- Clarify lenient audio validation and deterministic resampling.
- Keep lenient audio validation aligned with manifest accept entries.
- Copy Cloudflare Pages `_headers` and `_redirects` through the Vite public directory.
- Use a precached app-shell navigation fallback for offline share redirects.
- Terminate ASR worker work on cancel and hide Retry when source audio was deleted.
- Use non-mutating lint in deployment CI.
- Preserve prompt-based PWA update activation and offline manifest caching.
