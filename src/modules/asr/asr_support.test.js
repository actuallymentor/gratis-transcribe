import { describe, expect, it, vi } from 'vitest'
import { format_asr_support_error, get_browser_asr_support, get_webgpu_support, supports_wasm_simd } from './asr_support.js'

const create_scope = ( overrides = {} ) => ( {
    AudioContext: function AudioContext() {},
    OfflineAudioContext: function OfflineAudioContext() {},
    WebAssembly: {
        instantiate: vi.fn(),
        validate: vi.fn( () => true )
    },
    Worker: function Worker() {},
    caches: {},
    indexedDB: {},
    isSecureContext: true,
    location: {
        hostname: `example.test`,
        protocol: `https:`
    },
    navigator: {
        gpu: {
            requestAdapter: vi.fn( async () => ( { name: `test-adapter` } ) )
        },
        storage: {
            estimate: vi.fn()
        }
    },
    ...overrides
} )

describe( `ASR browser support checks`, () => {
    it( `reports a supported browser with WebGPU as preferred backend`, async () => {
        const support = await get_browser_asr_support( create_scope() )

        expect( support.supported ).toBe( true )
        expect( support.preferred_backend ).toBe( `webgpu` )
        expect( support.missing_required_checks ).toHaveLength( 0 )
        expect( support.checks.find( ( { id } ) => id === `webgpu` ) ).toMatchObject( {
            ok: true,
            required: false
        } )
    } )

    it( `uses WASM when WebGPU is unavailable`, async () => {
        const support = await get_browser_asr_support( create_scope( {
            navigator: {}
        } ) )

        expect( support.supported ).toBe( true )
        expect( support.preferred_backend ).toBe( `wasm` )
        expect( support.checks.find( ( { id } ) => id === `webgpu` ) ).toMatchObject( {
            ok: false,
            required: false
        } )
    } )

    it( `skips optional WebGPU probing when only required checks are needed`, async () => {
        const scope = create_scope()
        const support = await get_browser_asr_support( scope, { check_webgpu: false } )

        expect( support.supported ).toBe( true )
        expect( support.preferred_backend ).toBe( `wasm` )
        expect( scope.navigator.gpu.requestAdapter ).not.toHaveBeenCalled()
        expect( support.checks.some( ( { id } ) => id === `webgpu` ) ).toBe( false )
    } )

    it( `formats missing required capabilities`, async () => {
        const support = await get_browser_asr_support( create_scope( {
            WebAssembly: {
                instantiate: undefined,
                validate: vi.fn( () => false )
            },
            caches: null,
            navigator: {}
        } ) )

        expect( support.supported ).toBe( false )
        expect( format_asr_support_error( support ) ).toBe( `This browser cannot run local transcription yet: WebAssembly, WASM SIMD, Cache API.` )
    } )

    it( `requires OfflineAudioContext because browser decode uses it directly`, async () => {
        const support = await get_browser_asr_support( create_scope( {
            OfflineAudioContext: undefined
        } ) )

        expect( support.supported ).toBe( false )
        expect( support.missing_required_checks.map( ( { id } ) => id ) ).toContain( `audio_decode` )
    } )

    it( `handles WebGPU adapter errors as optional fallback`, async () => {
        const webgpu = await get_webgpu_support( create_scope( {
            navigator: {
                gpu: {
                    requestAdapter: vi.fn( async () => {
                        throw new Error( `adapter denied` )
                    } )
                }
            }
        } ) )

        expect( webgpu.supported ).toBe( false )
        expect( webgpu.label ).toBe( `WASM fallback` )
        expect( webgpu.detail ).toContain( `adapter denied` )
    } )

    it( `returns false when the SIMD probe cannot validate`, () => {
        const simd = supports_wasm_simd( create_scope( {
            WebAssembly: {
                validate: vi.fn( () => false )
            }
        } ) )

        expect( simd ).toBe( false )
    } )
} )
