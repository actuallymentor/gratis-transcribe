import { create } from 'zustand'
import { log } from 'mentie'
import { load_asr_model, warm_asr_model } from '../modules/asr/asr_client.js'
import { format_asr_support_error, get_browser_asr_support } from '../modules/asr/asr_support.js'
import { choose_best_model_profile, clear_model_caches, get_offline_readiness, get_selected_model_profile, mark_model_offline_ready, request_persistent_storage, set_selected_model_profile } from '../modules/model/model_cache.js'
import { MODEL_PROFILES } from '../modules/shared/constants.js'

const get_progress_percent = progress => {

    if( typeof progress?.progress === `number` ) return progress.progress
    if( progress?.loaded && progress?.total ) return progress.loaded / progress.total * 100

    return 0

}

export const use_model_store = create( ( set, get ) => ( {
    profile: MODEL_PROFILES.fast,
    readiness: false,
    setup_status: `idle`,
    setup_progress: 0,
    backend: ``,
    error: ``,
    support: null,

    initialize: async () => {
        const [ profile, readiness, support ] = await Promise.all( [
            get_selected_model_profile(),
            get_offline_readiness(),
            get_browser_asr_support()
        ] )

        set( {
            profile,
            readiness,
            support,
            backend: readiness?.backend || ``,
            setup_status: readiness?.ready ? `ready` : `missing`
        } )
    },

    refresh_support: async () => {
        const support = await get_browser_asr_support()
        set( { support } )

        return support
    },

    choose_best_profile: async () => {
        const profile = await choose_best_model_profile()
        await set_selected_model_profile( profile.id )
        set( { profile, readiness: false, setup_status: `missing` } )
    },

    select_profile: async profile_id => {
        const profile = await set_selected_model_profile( profile_id )
        set( { profile, readiness: false, setup_status: `missing`, backend: `` } )
    },

    download_model: async () => {
        const { profile } = get()

        try {
            set( { setup_status: `downloading`, setup_progress: 0, error: `` } )

            const support = await get().refresh_support()

            if( !support.supported ) throw new Error( format_asr_support_error( support ) )

            await request_persistent_storage()

            const load_result = await load_asr_model( profile, progress => {
                const percent = get_progress_percent( progress )

                set( { setup_progress: Math.max( get().setup_progress, Math.min( 95, Math.round( percent ) ) ) } )
            } )

            set( { setup_status: `warming`, backend: load_result.backend, setup_progress: 96 } )

            await warm_asr_model( progress => {
                if( progress?.progress ) set( { setup_progress: Math.max( 96, Math.round( progress.progress ) ) } )
            } )

            const readiness = await mark_model_offline_ready( profile, load_result.backend )

            set( { readiness, setup_status: `ready`, setup_progress: 100, backend: load_result.backend } )
        } catch ( error ) {
            log.error( `Model setup failed`, error )
            set( { setup_status: `failed`, error: error.message } )
            throw error
        }
    },

    clear_models: async () => {
        await clear_model_caches()
        set( { readiness: false, setup_status: `missing`, setup_progress: 0, backend: `` } )
    }
} ) )
