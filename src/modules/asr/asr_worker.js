import { create_asr_adapter } from './create_asr_adapter.js'

let adapter = create_asr_adapter( `whisper` )
let cancelled_ids = new Set()

self.addEventListener( `message`, event => {
    handle_message( event.data )
} )

async function handle_message( message ) {

    const { id, type, payload = {} } = message

    try {
        if( type === `cancel` ) {
            cancelled_ids.add( payload.id )
            post_success( id, { cancelled: true } )
            return
        }

        if( type === `load` ) {
            const result = await adapter.load( {
                profile: payload.profile,
                progress: progress => post_progress( id, progress )
            } )
            post_success( id, result )
            return
        }

        if( type === `transcribe` ) {
            const result = await adapter.transcribe( {
                audio: payload.audio,
                sample_rate: payload.sample_rate,
                progress: progress => post_progress( id, progress )
            } )

            if( cancelled_ids.has( id ) ) {
                cancelled_ids.delete( id )
                post_error( id, `Transcription cancelled.` )
                return
            }

            post_success( id, result )
            return
        }

        if( type === `warm` ) {
            const result = await adapter.warm( {
                progress: progress => post_progress( id, progress )
            } )
            post_success( id, result )
            return
        }

        if( type === `cache_status` ) {
            post_success( id, await adapter.get_cache_status() )
            return
        }

        throw new Error( `Unknown ASR worker message: ${ type }` )
    } catch ( error ) {
        post_error( id, error.message )
    }

}

function post_progress( id, progress ) {
    self.postMessage( { id, type: `progress`, progress } )
}

function post_success( id, result ) {
    self.postMessage( { id, type: `success`, result } )
}

function post_error( id, error ) {
    self.postMessage( { id, type: `error`, error } )
}
