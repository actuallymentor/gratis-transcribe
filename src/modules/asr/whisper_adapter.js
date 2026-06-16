import { env, pipeline } from '@huggingface/transformers'
import { log } from 'mentie'
import { CACHE_KEY, SAMPLE_RATE, WHISPER_CHUNK_LENGTH_S, WHISPER_STRIDE_LENGTH_S } from '../shared/constants.js'
import { get_onnx_runtime_asset_paths } from './onnx_runtime_assets.js'

let transcriber = null
let loaded_profile = null
let loaded_backend = null

const describe_error = error => error?.message || `${ error }`

const configure_transformers_environment = () => {

    env.useBrowserCache = true
    env.useWasmCache = true
    env.cacheKey = CACHE_KEY
    env.allowLocalModels = false
    env.allowRemoteModels = true

    // Keep ONNX Runtime from dynamically importing its default jsDelivr module.
    env.backends.onnx.wasm.wasmPaths = get_onnx_runtime_asset_paths()
    env.backends.onnx.wasm.proxy = false

}

const supports_webgpu = () => typeof navigator !== `undefined` && Boolean( navigator.gpu )

const normalize_segments = chunks => ( chunks || [] ).map( chunk => {

    const [ start_s = null, end_s = null ] = chunk.timestamp || []

    return {
        start_s,
        end_s,
        text: `${ chunk.text || `` }`.trim()
    }

} )

/**
 * Creates a Transformers.js Whisper adapter.
 * @returns {Object}
 */
export const create_whisper_adapter = () => {

    configure_transformers_environment()

    return {
        get model_id() {
            return loaded_profile?.model_id || ``
        },

        get label() {
            return loaded_profile?.label || `Whisper`
        },

        get backend() {
            return loaded_backend || ``
        },

        async load( { profile, progress = () => {} } ) {

            if( transcriber && loaded_profile?.id === profile.id ) return { backend: loaded_backend }

            loaded_profile = profile

            const preferred_device = supports_webgpu() ? `webgpu` : `wasm`
            const shared_options = {
                dtype: profile.dtype,
                revision: profile.revision,
                progress_callback: progress
            }

            try {
                transcriber = await pipeline( `automatic-speech-recognition`, profile.model_id, {
                    ...shared_options,
                    device: preferred_device
                } )
                loaded_backend = preferred_device
            } catch ( preferred_error ) {
                if( preferred_device === `wasm` ) throw new Error( `Speech model backend failed. wasm: ${ describe_error( preferred_error ) }` )

                log.warn( `WebGPU backend failed, falling back to WASM`, preferred_error )

                try {
                    transcriber = await pipeline( `automatic-speech-recognition`, profile.model_id, {
                        ...shared_options,
                        device: `wasm`
                    } )
                    loaded_backend = `wasm`
                } catch ( wasm_error ) {
                    throw new Error( `Speech model backend failed. webgpu: ${ describe_error( preferred_error ) }. wasm: ${ describe_error( wasm_error ) }` )
                }
            }

            return { backend: loaded_backend }

        },

        async transcribe( { audio, progress = () => {} } ) {

            if( !transcriber ) throw new Error( `Speech model has not loaded.` )

            progress( { status: `transcribing`, progress: 0 } )

            const result = await transcriber( audio, {
                chunk_length_s: WHISPER_CHUNK_LENGTH_S,
                stride_length_s: WHISPER_STRIDE_LENGTH_S,
                return_timestamps: true,
                sampling_rate: SAMPLE_RATE
            } )

            progress( { status: `transcribing`, progress: 100 } )

            return {
                text: `${ result.text || `` }`.trim(),
                segments: normalize_segments( result.chunks ),
                model_id: loaded_profile.model_id,
                model_backend: loaded_backend
            }

        },

        async warm( options ) {

            const silence = new Float32Array( SAMPLE_RATE )

            return this.transcribe( { ...options, audio: silence } )

        },

        async get_cache_status() {

            return {
                loaded: Boolean( transcriber ),
                model_id: loaded_profile?.model_id || null,
                backend: loaded_backend
            }

        }
    }

}
