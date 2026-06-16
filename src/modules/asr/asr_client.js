let worker = null
let message_counter = 0
const pending_messages = new Map()

function receive_worker_message( event ) {

    const { id, type, result, error, progress } = event.data
    const pending_message = pending_messages.get( id )

    if( !pending_message ) return

    if( type === `progress` ) {
        pending_message.progress( progress )
        return
    }

    pending_messages.delete( id )

    if( type === `error` ) {
        pending_message.reject( new Error( error ) )
        return
    }

    pending_message.resolve( result )

}

const get_worker = () => {

    if( worker ) return worker

    worker = new Worker( new URL( `./asr_worker.js`, import.meta.url ), { type: `module` } )
    worker.addEventListener( `message`, receive_worker_message )

    return worker

}

const post_worker_message = ( type, payload = {}, { progress = () => {}, transfer = [] } = {} ) => {

    const id = `${ Date.now() }-${ ++message_counter }`
    const active_worker = get_worker()

    return new Promise( ( resolve, reject ) => {
        pending_messages.set( id, { resolve, reject, progress } )

        try {
            active_worker.postMessage( { id, type, payload }, transfer )
        } catch ( error ) {
            pending_messages.delete( id )
            reject( error )
        }
    } )

}

/**
 * Terminates active ASR work and rejects pending worker requests.
 * @param {string} reason
 * @returns {void}
 */
export const cancel_asr_work = ( reason = `Transcription cancelled.` ) => {

    if( !worker ) return

    const error = new Error( reason )

    worker.removeEventListener( `message`, receive_worker_message )
    worker.terminate()
    worker = null

    pending_messages.forEach( ( { reject } ) => reject( error ) )
    pending_messages.clear()

}

/**
 * Loads the configured ASR model in the worker.
 * @param {Object} profile
 * @param {Function} progress
 * @returns {Promise<Object>}
 */
export const load_asr_model = ( profile, progress ) => post_worker_message( `load`, { profile }, { progress } )

/**
 * Warms the loaded ASR model.
 * @param {Function} progress
 * @returns {Promise<Object>}
 */
export const warm_asr_model = progress => post_worker_message( `warm`, {}, { progress } )

/**
 * Transcribes a prepared audio buffer in the worker.
 * @param {Object} options
 * @param {Float32Array} options.audio
 * @param {number} options.sample_rate
 * @param {Function} options.progress
 * @returns {Promise<Object>}
 */
export const transcribe_audio = ( { audio, sample_rate, progress } ) => post_worker_message(
    `transcribe`,
    { audio, sample_rate },
    { progress, transfer: [ audio.buffer ] }
)

/**
 * Reads the worker model cache status.
 * @returns {Promise<Object>}
 */
export const get_asr_cache_status = () => post_worker_message( `cache_status` )
