const WASM_SIMD_PROBE = new Uint8Array( [
    0, 97, 115, 109, 1, 0, 0, 0,
    1, 5, 1, 96, 0, 1, 123,
    3, 2, 1, 0,
    10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11
] )

const has_function = value => typeof value === `function`

const get_location = scope => scope.location || scope.document?.location || {}

const is_localhost = scope => {

    const { hostname = `` } = get_location( scope )

    return hostname === `localhost` || hostname === `127.0.0.1` || hostname === `[::1]`

}

const create_check = ( { id, label, ok, required = true, available, unavailable } ) => ( {
    id,
    label,
    ok: Boolean( ok ),
    required,
    tone: ok ? `ready` : required ? `error` : `warn`,
    detail: ok ? available : unavailable
} )

/**
 * Checks whether WebAssembly SIMD is available.
 * @param {Object} scope
 * @returns {boolean}
 */
export const supports_wasm_simd = ( scope = globalThis ) => {

    try {
        return has_function( scope.WebAssembly?.validate ) && scope.WebAssembly.validate( WASM_SIMD_PROBE )
    } catch {
        return false
    }

}

/**
 * Checks whether WebGPU can provide an adapter.
 * @param {Object} scope
 * @returns {Promise<Object>}
 */
export const get_webgpu_support = async ( scope = globalThis ) => {

    const gpu = scope.navigator?.gpu

    if( !has_function( gpu?.requestAdapter ) ) return {
        supported: false,
        label: `WASM fallback`,
        detail: `WebGPU is not exposed by this browser.`
    }

    try {
        const adapter = await gpu.requestAdapter()

        if( adapter ) return {
            supported: true,
            label: `WebGPU available`,
            detail: `WebGPU acceleration is available.`
        }

        return {
            supported: false,
            label: `WASM fallback`,
            detail: `WebGPU is exposed, but no adapter was available.`
        }
    } catch ( error ) {
        return {
            supported: false,
            label: `WASM fallback`,
            detail: `WebGPU check failed: ${ error.message }`
        }
    }

}

/**
 * Collects browser support required for local ASR model loading.
 * @param {Object} scope
 * @param {Object} options
 * @param {boolean} options.check_webgpu
 * @returns {Promise<Object>}
 */
export const get_browser_asr_support = async ( scope = globalThis, { check_webgpu = true } = {} ) => {

    const webgpu = check_webgpu ? await get_webgpu_support( scope ) : null
    const secure_context = Boolean( scope.isSecureContext || is_localhost( scope ) )
    const has_wasm = typeof scope.WebAssembly === `object` && has_function( scope.WebAssembly.instantiate )
    const has_audio_decoder = has_function( scope.OfflineAudioContext )

    const required_checks = [
        create_check( {
            id: `secure_context`,
            label: `Secure context`,
            ok: secure_context,
            available: `HTTPS or localhost is active.`,
            unavailable: `Open the app over HTTPS or localhost.`
        } ),
        create_check( {
            id: `workers`,
            label: `Web workers`,
            ok: has_function( scope.Worker ),
            available: `Model work can run off the UI thread.`,
            unavailable: `This browser cannot start the ASR worker.`
        } ),
        create_check( {
            id: `webassembly`,
            label: `WebAssembly`,
            ok: has_wasm,
            available: `WASM inference is available.`,
            unavailable: `This browser cannot run the WASM model backend.`
        } ),
        create_check( {
            id: `wasm_simd`,
            label: `WASM SIMD`,
            ok: supports_wasm_simd( scope ),
            available: `Optimized ONNX Runtime WASM is available.`,
            unavailable: `This browser cannot run the bundled ONNX Runtime WASM build.`
        } ),
        create_check( {
            id: `indexeddb`,
            label: `IndexedDB`,
            ok: Boolean( scope.indexedDB ),
            available: `Audio and transcript records can be stored locally.`,
            unavailable: `Local transcription records cannot be saved.`
        } ),
        create_check( {
            id: `cache_api`,
            label: `Cache API`,
            ok: Boolean( scope.caches ),
            available: `Model files can be cached locally.`,
            unavailable: `The downloaded model cannot be cached for offline use.`
        } ),
        create_check( {
            id: `audio_decode`,
            label: `Audio decode`,
            ok: has_audio_decoder,
            available: `Audio files can be decoded before transcription.`,
            unavailable: `This browser cannot decode uploaded audio files.`
        } )
    ]

    const optional_checks = check_webgpu ? [
        create_check( {
            id: `webgpu`,
            label: webgpu?.label,
            ok: webgpu?.supported,
            required: false,
            available: webgpu?.detail,
            unavailable: webgpu?.detail
        } )
    ] : []

    const checks = [
        ...required_checks,
        ...optional_checks
    ]

    const missing_required_checks = checks.filter( ( { ok, required } ) => required && !ok )

    return {
        supported: missing_required_checks.length === 0,
        preferred_backend: webgpu?.supported ? `webgpu` : `wasm`,
        checks,
        missing_required_checks
    }

}

/**
 * Formats ASR support failures for user-facing errors.
 * @param {Object} support
 * @returns {string}
 */
export const format_asr_support_error = support => {

    const missing_labels = support?.missing_required_checks?.map( ( { label } ) => label ) || []

    if( missing_labels.length === 0 ) return `This browser can run local transcription.`

    return `This browser cannot run local transcription yet: ${ missing_labels.join( `, ` ) }.`

}
