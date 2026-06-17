import { beforeEach, describe, expect, it, vi } from 'vitest'
import { load_asr_model, warm_asr_model } from '../modules/asr/asr_client.js'
import { get_browser_asr_support } from '../modules/asr/asr_support.js'
import { MODEL_PROFILES } from '../modules/shared/constants.js'
import { mark_model_offline_ready } from '../modules/model/model_cache.js'
import { use_model_store } from './model_store.js'

const mock_profile = vi.hoisted( () => ( {
    dtype: `q4`,
    estimated_bytes: 160,
    id: `fast`,
    label: `Whisper Base`,
    model_id: `mock-whisper`,
    revision: `main`
} ) )

vi.mock( '../modules/asr/asr_client.js', () => ( {
    load_asr_model: vi.fn( async () => ( { backend: `wasm` } ) ),
    warm_asr_model: vi.fn( async () => ( { text: `` } ) )
} ) )

vi.mock( '../modules/asr/asr_support.js', () => ( {
    format_asr_support_error: vi.fn( support => `Unsupported: ${ support.missing_required_checks.map( ( { label } ) => label ).join( `, ` ) }.` ),
    get_browser_asr_support: vi.fn( async () => ( {
        supported: true,
        missing_required_checks: []
    } ) )
} ) )

vi.mock( '../modules/model/model_cache.js', () => ( {
    choose_best_model_profile: vi.fn( async () => mock_profile ),
    clear_model_caches: vi.fn( async () => {} ),
    get_offline_readiness: vi.fn( async () => false ),
    get_selected_model_profile: vi.fn( async () => mock_profile ),
    mark_model_offline_ready: vi.fn( async ( profile, backend ) => ( {
        ready: true,
        model_profile_id: profile.id,
        backend
    } ) ),
    request_persistent_storage: vi.fn( async () => true ),
    set_selected_model_profile: vi.fn( async () => mock_profile )
} ) )

describe( `model store`, () => {
    beforeEach( () => {
        vi.clearAllMocks()
        use_model_store.setState( {
            profile: MODEL_PROFILES.fast,
            readiness: false,
            setup_status: `idle`,
            setup_progress: 0,
            backend: ``,
            error: ``,
            support: null
        } )
    } )

    it( `does not load the model when required browser support is missing`, async () => {
        get_browser_asr_support.mockResolvedValueOnce( {
            supported: false,
            missing_required_checks: [ { label: `Cache API` } ]
        } )

        await expect( use_model_store.getState().download_model() ).rejects.toThrow( `Unsupported: Cache API.` )

        expect( load_asr_model ).not.toHaveBeenCalled()
        expect( warm_asr_model ).not.toHaveBeenCalled()
        expect( use_model_store.getState().setup_status ).toBe( `failed` )
        expect( use_model_store.getState().error ).toBe( `Unsupported: Cache API.` )
    } )

    it( `marks the model ready after supported load and warmup`, async () => {
        await use_model_store.getState().download_model()

        expect( load_asr_model ).toHaveBeenCalledWith( MODEL_PROFILES.fast, expect.any( Function ) )
        expect( warm_asr_model ).toHaveBeenCalledWith( expect.any( Function ) )
        expect( mark_model_offline_ready ).toHaveBeenCalledWith( MODEL_PROFILES.fast, `wasm` )
        expect( use_model_store.getState().setup_status ).toBe( `ready` )
        expect( use_model_store.getState().backend ).toBe( `wasm` )
    } )
} )
