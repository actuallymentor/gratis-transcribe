import { create } from 'zustand'
import { log } from 'mentie'
import { cancel_asr_work, load_asr_model, transcribe_audio } from '../modules/asr/asr_client.js'
import { format_asr_support_error, get_browser_asr_support } from '../modules/asr/asr_support.js'
import { prepare_audio_file } from '../modules/audio/decode_audio.js'
import { get_selected_model_profile } from '../modules/model/model_cache.js'
import { clear_share_with_transcript, load_share_with_transcript, mark_share_status, save_manual_audio_file } from '../modules/share/share_db.js'
import { format_bytes, validate_shared_audio_file } from '../modules/share/share_target.js'
import { SETTING_KEYS, SHARE_STATUS } from '../modules/shared/constants.js'
import { delete_transcript, get_setting, save_setting, save_transcript } from '../modules/storage/app_db.js'

const get_progress_percent = progress => {

    if( typeof progress?.progress === `number` ) return progress.progress
    if( progress?.loaded && progress?.total ) return progress.loaded / progress.total * 100

    return 0

}

const initial_progress = {
    phase: `idle`,
    percent: 0,
    label: ``
}

export const use_transcript_store = create( ( set, get ) => ( {
    share: null,
    transcript: null,
    progress: initial_progress,
    error: ``,
    is_processing: false,
    active_run_id: null,

    set_error: error => set( { error } ),

    load_share: async share_id => {
        const { share, transcript } = await load_share_with_transcript( share_id )
        set( { share, transcript, error: share ? `` : `Shared audio was not found on this device.` } )

        return share
    },

    save_manual_file: async file => {
        const share = await save_manual_audio_file( file )
        set( { share, transcript: null, error: `` } )

        return share
    },

    process_current_share: async () => {
        const { share } = get()

        if( get().is_processing ) return null

        if( !share?.file ) {
            set( { error: `The original audio file is no longer stored on this device.` } )
            return null
        }

        const validation = validate_shared_audio_file( share.file )

        if( !validation.ok ) {
            set( { error: validation.message } )
            await mark_share_status( share.share_id, SHARE_STATUS.failed, { error: validation.message } )
            return null
        }

        const run_id = crypto.randomUUID()
        const is_current_run = () => get().active_run_id === run_id && get().is_processing
        const set_run_state = state => {
            if( is_current_run() ) set( state )
        }

        try {
            set( {
                is_processing: true,
                active_run_id: run_id,
                error: ``,
                progress: { phase: `preparing`, percent: 5, label: `Preparing audio` }
            } )

            const support = await get_browser_asr_support( globalThis, { check_webgpu: false } )

            if( !is_current_run() ) return null
            if( !support.supported ) throw new Error( format_asr_support_error( support ) )

            const [ delete_audio_after_transcription, profile ] = await Promise.all( [
                get_setting( SETTING_KEYS.delete_audio_after_transcription, true ),
                get_selected_model_profile()
            ] )

            if( !is_current_run() ) return null

            await mark_share_status( share.share_id, SHARE_STATUS.processing )

            const prepared_audio = await prepare_audio_file( share.file, {
                progress: progress => set_run_state( {
                    progress: {
                        phase: `preparing`,
                        percent: Math.max( 5, Math.min( 35, Math.round( progress.percent * 0.35 ) ) ),
                        label: `Preparing audio`
                    }
                } )
            } )

            if( !is_current_run() ) return null

            if( !navigator.onLine ) {
                const readiness = await get_setting( SETTING_KEYS.offline_ready, false )

                if( !is_current_run() ) return null
                if( !readiness?.ready ) throw new Error( `Download the speech model once before transcribing offline.` )
            }

            set_run_state( { progress: { phase: `loading`, percent: 40, label: `Loading model` } } )

            const load_result = await load_asr_model( profile, progress => {
                const percent = get_progress_percent( progress )

                set_run_state( { progress: { phase: `loading`, percent: Math.max( 40, Math.min( 70, 40 + Math.round( percent * 0.3 ) ) ), label: `Loading model` } } )
            } )

            if( !is_current_run() ) return null

            set_run_state( { progress: { phase: `transcribing`, percent: 72, label: `Transcribing on this device` } } )

            const result = await transcribe_audio( {
                audio: prepared_audio.audio,
                sample_rate: prepared_audio.sample_rate,
                progress: progress => {
                    const percent = progress?.progress || 0
                    set_run_state( { progress: { phase: `transcribing`, percent: Math.max( 72, Math.min( 98, 72 + Math.round( percent * 0.26 ) ) ), label: `Transcribing on this device` } } )
                }
            } )

            if( !is_current_run() ) return null

            const transcript = await save_transcript( {
                share_id: share.share_id,
                text: result.text,
                segments: result.segments,
                model_id: result.model_id,
                model_backend: result.model_backend || load_result.backend,
                duration_s: prepared_audio.duration_s
            } )

            if( !is_current_run() ) {
                await delete_transcript( transcript.transcript_id )
                return null
            }

            const updated_share = await mark_share_status( share.share_id, SHARE_STATUS.complete, {
                transcript_id: transcript.transcript_id,
                file: delete_audio_after_transcription ? null : share.file,
                error: null
            } )

            if( !is_current_run() ) {
                await mark_share_status( share.share_id, SHARE_STATUS.cancelled, { transcript_id: null } )
                await delete_transcript( transcript.transcript_id )
                return null
            }

            set( {
                share: updated_share,
                transcript,
                is_processing: false,
                active_run_id: null,
                progress: { phase: `complete`, percent: 100, label: `Complete` }
            } )

            return transcript
        } catch ( error ) {
            if( !is_current_run() ) return null

            log.error( `Transcription failed for ${ share.name || format_bytes( share.size ) }`, error )
            await mark_share_status( share.share_id, SHARE_STATUS.failed, { error: error.message } )
            set( {
                error: error.message,
                is_processing: false,
                active_run_id: null,
                progress: { phase: `failed`, percent: 0, label: `Failed` }
            } )
            return null
        }
    },

    cancel_processing: async () => {
        const { share } = get()

        cancel_asr_work()

        set( {
            active_run_id: null,
            is_processing: false,
            progress: { phase: `cancelled`, percent: 0, label: `Cancelled` }
        } )

        if( share?.share_id ) await mark_share_status( share.share_id, SHARE_STATUS.cancelled )
    },

    clear_current_share: async () => {
        const { share } = get()

        set( { active_run_id: null, is_processing: false } )
        await clear_share_with_transcript( share )
        set( { share: null, transcript: null, progress: initial_progress, error: ``, is_processing: false, active_run_id: null } )
    },

    set_delete_audio_after_transcription: value => save_setting( SETTING_KEYS.delete_audio_after_transcription, value )
} ) )
