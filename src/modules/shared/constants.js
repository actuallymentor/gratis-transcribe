export const APP_NAME = `Transcribe Gratis`

export const DB_NAME = `transcribe_gratis`
export const DB_VERSION = 1

export const STORE_INCOMING_SHARES = `incoming_shares`
export const STORE_TRANSCRIPTS = `transcripts`
export const STORE_SETTINGS = `settings`

export const SHARE_STATUS = Object.freeze( {
    received: `received`,
    processing: `processing`,
    complete: `complete`,
    failed: `failed`,
    cancelled: `cancelled`
} )

export const SETTING_KEYS = Object.freeze( {
    selected_model_profile: `selected_model_profile`,
    offline_ready: `offline_ready`,
    delete_audio_after_transcription: `delete_audio_after_transcription`,
    last_successful_model_check: `last_successful_model_check`
} )

export const SAMPLE_RATE = 16_000
export const MAX_AUDIO_FILE_BYTES = 100 * 1_024 * 1_024
export const MAX_DECODED_DURATION_S = 30 * 60
export const WHISPER_CHUNK_LENGTH_S = 30
export const WHISPER_STRIDE_LENGTH_S = 1

export const SHARE_ERROR_MESSAGES = Object.freeze( {
    no_audio: `No audio file was shared.`,
    not_audio: `That file does not look like a supported audio message.`,
    too_large: `That audio file is larger than the 100 MB limit.`,
    storage_failed: `The audio file could not be saved on this device.`
} )

export const ACCEPTED_AUDIO_EXTENSIONS = Object.freeze( [
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
] )

export const ACCEPTED_AUDIO_MIME_TYPES = Object.freeze( [
    `audio/ogg`,
    `audio/opus`,
    `audio/mpeg`,
    `audio/mp4`,
    `audio/aac`,
    `audio/flac`,
    `audio/amr`,
    `audio/wav`,
    `audio/wave`,
    `audio/x-wav`,
    `audio/webm`,
    `video/3gpp`
] )

export const GENERIC_AUDIO_SHARE_MIME_TYPES = Object.freeze( [
    ``,
    `application/octet-stream`,
    `binary/octet-stream`,
    `application/ogg`,
    `application/x-ogg`
] )

export const SHARE_TARGET_AUDIO_ACCEPT = Object.freeze( [
    `audio/*`,
    ...ACCEPTED_AUDIO_MIME_TYPES,
    ...GENERIC_AUDIO_SHARE_MIME_TYPES.filter( Boolean ),
    ...ACCEPTED_AUDIO_EXTENSIONS
] )

export const MODEL_PROFILES = Object.freeze( {
    fast: {
        id: `fast`,
        label: `Whisper Base`,
        model_id: `onnx-community/whisper-base`,
        revision: `main`,
        dtype: `q4`,
        estimated_bytes: 160 * 1_024 * 1_024
    },
    accurate: {
        id: `accurate`,
        label: `Whisper Small`,
        model_id: `onnx-community/whisper-small`,
        revision: `main`,
        dtype: `q4`,
        estimated_bytes: 320 * 1_024 * 1_024
    }
} )

export const DEFAULT_MODEL_PROFILE_ID = `fast`
export const CACHE_KEY = `transcribe-gratis-transformers-v1`
