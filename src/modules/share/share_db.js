import { SHARE_STATUS } from '../shared/constants.js'
import { delete_incoming_share, delete_transcript, load_incoming_share, load_transcript, save_incoming_share, update_incoming_share } from '../storage/app_db.js'
import { validate_shared_audio_file } from './share_target.js'

/**
 * Stores a manually selected audio file using the same shape as share-target files.
 * @param {File} file
 * @returns {Promise<Object>}
 */
export const save_manual_audio_file = async file => {

    const validation = validate_shared_audio_file( file )

    if( !validation.ok ) throw new Error( validation.message )

    return save_incoming_share( {
        share_id: crypto.randomUUID(),
        file,
        name: file.name || `audio`,
        type: file.type || ``,
        size: file.size,
        title: ``,
        text: ``,
        url: ``,
        received_at: Date.now(),
        status: SHARE_STATUS.received
    } )

}

/**
 * Loads a share and attached transcript if present.
 * @param {string} share_id
 * @returns {Promise<{share: Object|null, transcript: Object|null}>}
 */
export const load_share_with_transcript = async share_id => {

    const share = await load_incoming_share( share_id )
    const transcript = share?.transcript_id ? await load_transcript( share.transcript_id ) : null

    return { share, transcript }

}

/**
 * Clears a share and its transcript.
 * @param {Object} share
 * @returns {Promise<void>}
 */
export const clear_share_with_transcript = async share => {

    if( share?.transcript_id ) await delete_transcript( share.transcript_id )
    if( share?.share_id ) await delete_incoming_share( share.share_id )

}

/**
 * Marks a share with a new processing status.
 * @param {string} share_id
 * @param {string} status
 * @param {Object} extra
 * @returns {Promise<Object|null>}
 */
export const mark_share_status = ( share_id, status, extra = {} ) => update_incoming_share( share_id, { status, ...extra } )
