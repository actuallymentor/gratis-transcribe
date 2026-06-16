import { openDB } from 'idb'
import { DB_NAME, DB_VERSION, SHARE_STATUS, STORE_INCOMING_SHARES, STORE_SETTINGS, STORE_TRANSCRIPTS } from '../shared/constants.js'

let db_promise

/**
 * Opens the application IndexedDB database.
 * @returns {Promise<import('idb').IDBPDatabase>}
 */
export const open_app_db = () => {

    if( db_promise ) return db_promise

    db_promise = openDB( DB_NAME, DB_VERSION, {
        upgrade( db ) {
            if( !db.objectStoreNames.contains( STORE_INCOMING_SHARES ) ) db.createObjectStore( STORE_INCOMING_SHARES, { keyPath: `share_id` } )
            if( !db.objectStoreNames.contains( STORE_TRANSCRIPTS ) ) db.createObjectStore( STORE_TRANSCRIPTS, { keyPath: `transcript_id` } )
            if( !db.objectStoreNames.contains( STORE_SETTINGS ) ) db.createObjectStore( STORE_SETTINGS, { keyPath: `key` } )
        }
    } )

    return db_promise

}

/**
 * Saves or replaces an incoming share record.
 * @param {Object} share
 * @returns {Promise<Object>}
 */
export const save_incoming_share = async share => {

    const db = await open_app_db()
    const normalized_share = {
        status: SHARE_STATUS.received,
        received_at: Date.now(),
        ...share
    }

    await db.put( STORE_INCOMING_SHARES, normalized_share )

    return normalized_share

}

/**
 * Loads an incoming share by id.
 * @param {string} share_id
 * @returns {Promise<Object|null>}
 */
export const load_incoming_share = async share_id => {

    if( !share_id ) return null

    const db = await open_app_db()
    const share = await db.get( STORE_INCOMING_SHARES, share_id )

    return share || null

}

/**
 * Lists recent incoming shares, newest first.
 * @returns {Promise<Array>}
 */
export const list_incoming_shares = async () => {

    const db = await open_app_db()
    const shares = await db.getAll( STORE_INCOMING_SHARES )

    return shares.sort( ( left, right ) => ( right.received_at || 0 ) - ( left.received_at || 0 ) )

}

/**
 * Updates an incoming share with a partial patch.
 * @param {string} share_id
 * @param {Object} patch
 * @returns {Promise<Object|null>}
 */
export const update_incoming_share = async ( share_id, patch ) => {

    const db = await open_app_db()
    const share = await db.get( STORE_INCOMING_SHARES, share_id )

    if( !share ) return null

    const updated_share = { ...share, ...patch }
    await db.put( STORE_INCOMING_SHARES, updated_share )

    return updated_share

}

/**
 * Deletes an incoming share record.
 * @param {string} share_id
 * @returns {Promise<void>}
 */
export const delete_incoming_share = async share_id => {

    const db = await open_app_db()
    await db.delete( STORE_INCOMING_SHARES, share_id )

}

/**
 * Saves a transcript record.
 * @param {Object} transcript
 * @returns {Promise<Object>}
 */
export const save_transcript = async transcript => {

    const db = await open_app_db()
    const normalized_transcript = {
        transcript_id: crypto.randomUUID(),
        created_at: Date.now(),
        segments: [],
        ...transcript
    }

    await db.put( STORE_TRANSCRIPTS, normalized_transcript )

    return normalized_transcript

}

/**
 * Loads a transcript by id.
 * @param {string} transcript_id
 * @returns {Promise<Object|null>}
 */
export const load_transcript = async transcript_id => {

    if( !transcript_id ) return null

    const db = await open_app_db()
    const transcript = await db.get( STORE_TRANSCRIPTS, transcript_id )

    return transcript || null

}

/**
 * Deletes a transcript record.
 * @param {string} transcript_id
 * @returns {Promise<void>}
 */
export const delete_transcript = async transcript_id => {

    const db = await open_app_db()
    await db.delete( STORE_TRANSCRIPTS, transcript_id )

}

/**
 * Reads a setting value.
 * @param {string} key
 * @param {*} fallback
 * @returns {Promise<*>}
 */
export const get_setting = async ( key, fallback = null ) => {

    const db = await open_app_db()
    const setting = await db.get( STORE_SETTINGS, key )

    return setting ? setting.value : fallback

}

/**
 * Saves a setting value.
 * @param {string} key
 * @param {*} value
 * @returns {Promise<*>}
 */
export const save_setting = async ( key, value ) => {

    const db = await open_app_db()
    await db.put( STORE_SETTINGS, { key, value, updated_at: Date.now() } )

    return value

}

/**
 * Clears all stored audio shares and transcripts.
 * @returns {Promise<void>}
 */
export const clear_content_storage = async () => {

    const db = await open_app_db()
    await Promise.all( [
        db.clear( STORE_INCOMING_SHARES ),
        db.clear( STORE_TRANSCRIPTS )
    ] )

}
