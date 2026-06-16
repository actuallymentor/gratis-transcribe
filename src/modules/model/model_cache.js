import { DEFAULT_MODEL_PROFILE_ID, MODEL_PROFILES, SETTING_KEYS } from '../shared/constants.js'
import { get_setting, save_setting } from '../storage/app_db.js'

/**
 * Estimates storage and selects a suitable model profile.
 * @returns {Promise<Object>}
 */
export const choose_best_model_profile = async () => {

    const storage_estimate = navigator.storage?.estimate ? await navigator.storage.estimate() : {}
    const available_bytes = ( storage_estimate.quota || 0 ) - ( storage_estimate.usage || 0 )
    const device_memory = navigator.deviceMemory || 4
    const enough_for_accurate = available_bytes > MODEL_PROFILES.accurate.estimated_bytes * 2 && device_memory >= 6

    return enough_for_accurate ? MODEL_PROFILES.accurate : MODEL_PROFILES.fast

}

/**
 * Returns the selected model profile id.
 * @returns {Promise<string>}
 */
export const get_selected_model_profile_id = async () => {

    const stored_profile_id = await get_setting( SETTING_KEYS.selected_model_profile, null )

    if( stored_profile_id ) return stored_profile_id

    const profile = await choose_best_model_profile()

    await save_setting( SETTING_KEYS.selected_model_profile, profile.id )

    return profile.id

}

/**
 * Returns the selected model profile.
 * @returns {Promise<Object>}
 */
export const get_selected_model_profile = async () => {

    const profile_id = await get_selected_model_profile_id()

    return MODEL_PROFILES[ profile_id ] || MODEL_PROFILES[ DEFAULT_MODEL_PROFILE_ID ]

}

/**
 * Saves the selected model profile.
 * @param {string} profile_id
 * @returns {Promise<Object>}
 */
export const set_selected_model_profile = async profile_id => {

    const profile = MODEL_PROFILES[ profile_id ] || MODEL_PROFILES[ DEFAULT_MODEL_PROFILE_ID ]

    await save_setting( SETTING_KEYS.selected_model_profile, profile.id )
    await save_setting( SETTING_KEYS.offline_ready, false )

    return profile

}

/**
 * Requests durable browser storage when available.
 * @returns {Promise<boolean>}
 */
export const request_persistent_storage = async () => {

    if( !navigator.storage?.persist ) return false

    return navigator.storage.persist()

}

/**
 * Marks a model profile as offline ready.
 * @param {Object} profile
 * @param {string} backend
 * @returns {Promise<Object>}
 */
export const mark_model_offline_ready = async ( profile, backend ) => {

    const readiness = {
        ready: true,
        model_profile_id: profile.id,
        model_id: profile.model_id,
        revision: profile.revision,
        backend,
        checked_at: Date.now()
    }

    await save_setting( SETTING_KEYS.offline_ready, readiness )
    await save_setting( SETTING_KEYS.last_successful_model_check, readiness.checked_at )

    return readiness

}

/**
 * Loads the stored offline readiness record.
 * @returns {Promise<Object>}
 */
export const get_offline_readiness = async () => get_setting( SETTING_KEYS.offline_ready, false )

/**
 * Clears model-related browser caches.
 * @returns {Promise<void>}
 */
export const clear_model_caches = async () => {

    if( !window.caches ) return

    const cache_names = await caches.keys()
    const model_caches = cache_names.filter( cache_name => cache_name.includes( `transformers` ) || cache_name.includes( `model` ) || cache_name.includes( `onnx` ) || cache_name.includes( `wasm` ) )

    await Promise.all( model_caches.map( cache_name => caches.delete( cache_name ) ) )
    await save_setting( SETTING_KEYS.offline_ready, false )

}
