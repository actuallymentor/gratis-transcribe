import { create_parakeet_adapter } from './parakeet_adapter.js'
import { create_whisper_adapter } from './whisper_adapter.js'

/**
 * Creates an ASR adapter by id.
 * @param {string} adapter_id
 * @returns {Object}
 */
export const create_asr_adapter = ( adapter_id = `whisper` ) => {

    if( adapter_id === `parakeet` ) return create_parakeet_adapter()

    return create_whisper_adapter()

}
