import { waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prepare_audio_file } from '../modules/audio/decode_audio.js'
import { load_incoming_share } from '../modules/storage/app_db.js'
import { DB_NAME, SHARE_STATUS } from '../modules/shared/constants.js'
import { cancel_asr_work, transcribe_audio } from '../modules/asr/asr_client.js'
import { use_transcript_store } from './transcript_store.js'

let resolve_prepared_audio

vi.mock( '../modules/audio/decode_audio.js', () => ( {
    prepare_audio_file: vi.fn( () => new Promise( resolve => {
        resolve_prepared_audio = resolve
    } ) )
} ) )

vi.mock( '../modules/asr/asr_client.js', () => ( {
    cancel_asr_work: vi.fn(),
    load_asr_model: vi.fn( async () => ( { backend: `wasm` } ) ),
    transcribe_audio: vi.fn( async () => ( {
        text: `late transcript`,
        segments: [],
        model_id: `mock-whisper`,
        model_backend: `wasm`
    } ) )
} ) )

vi.mock( '../modules/model/model_cache.js', () => ( {
    get_selected_model_profile: vi.fn( async () => ( {
        model_id: `mock-whisper`,
        runtime: `whisper`
    } ) )
} ) )

describe( `transcript store`, () => {
    beforeEach( () => {
        indexedDB.deleteDatabase( DB_NAME )
        resolve_prepared_audio = null
        vi.clearAllMocks()
        use_transcript_store.setState( {
            share: null,
            transcript: null,
            progress: { phase: `idle`, percent: 0, label: `` },
            error: ``,
            is_processing: false,
            active_run_id: null
        } )
    } )

    it( `does not save a transcript after cancellation`, async () => {
        const file = new File( [ new Uint8Array( [ 1, 2, 3, 4 ] ) ], `voice.ogg`, { type: `audio/ogg` } )

        const share = await use_transcript_store.getState().save_manual_file( file )
        const processing = use_transcript_store.getState().process_current_share()

        await waitFor( () => expect( prepare_audio_file ).toHaveBeenCalled() )
        await use_transcript_store.getState().cancel_processing()

        resolve_prepared_audio( {
            audio: new Float32Array( [ 0 ] ),
            sample_rate: 16_000,
            duration_s: 1
        } )

        await processing

        const stored_share = await load_incoming_share( share.share_id )

        expect( transcribe_audio ).not.toHaveBeenCalled()
        expect( cancel_asr_work ).toHaveBeenCalledTimes( 1 )
        expect( stored_share.status ).toBe( SHARE_STATUS.cancelled )
        expect( use_transcript_store.getState().transcript ).toBeNull()
    } )

    it( `ignores duplicate starts while setup is still loading`, async () => {
        const file = new File( [ new Uint8Array( [ 1, 2, 3, 4 ] ) ], `voice.ogg`, { type: `audio/ogg` } )

        await use_transcript_store.getState().save_manual_file( file )

        const first_processing = use_transcript_store.getState().process_current_share()
        const second_processing = await use_transcript_store.getState().process_current_share()

        await waitFor( () => expect( prepare_audio_file ).toHaveBeenCalled() )

        resolve_prepared_audio( {
            audio: new Float32Array( [ 0 ] ),
            sample_rate: 16_000,
            duration_s: 1
        } )

        await first_processing

        expect( second_processing ).toBeNull()
        expect( prepare_audio_file ).toHaveBeenCalledTimes( 1 )
    } )
} )
