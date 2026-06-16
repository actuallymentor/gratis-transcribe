import { ACCEPTED_AUDIO_EXTENSIONS, ACCEPTED_AUDIO_MIME_TYPES, GENERIC_AUDIO_SHARE_MIME_TYPES, MAX_AUDIO_FILE_BYTES, SHARE_ERROR_MESSAGES } from '../shared/constants.js'

const ACCEPTED_EXTENSION_SET = new Set( ACCEPTED_AUDIO_EXTENSIONS )
const ACCEPTED_MIME_TYPE_SET = new Set( ACCEPTED_AUDIO_MIME_TYPES )
const GENERIC_MIME_TYPE_SET = new Set( GENERIC_AUDIO_SHARE_MIME_TYPES )

const normalize_mime_type = mime_type => `${ mime_type || `` }`.toLowerCase().split( `;` )[ 0 ].trim()

/**
 * Extracts a normalized extension from a filename.
 * @param {string} file_name
 * @returns {string}
 */
export const get_file_extension = ( file_name = `` ) => {

    const normalized_name = `${ file_name }`.toLowerCase()
    const extension_start = normalized_name.lastIndexOf( `.` )

    if( extension_start < 0 ) return ``

    return normalized_name.slice( extension_start )

}

/**
 * Checks whether an incoming share looks like an accepted audio file.
 * @param {File|Blob|Object} file
 * @returns {boolean}
 */
export const is_probable_audio_file = ( file ) => {

    if( !file ) return false

    const mime_type = normalize_mime_type( file.type )
    const extension = get_file_extension( file.name || `` )

    if( mime_type.startsWith( `audio/` ) ) return true
    if( ACCEPTED_MIME_TYPE_SET.has( mime_type ) ) return true
    if( GENERIC_MIME_TYPE_SET.has( mime_type ) && ACCEPTED_EXTENSION_SET.has( extension ) ) return true

    return ACCEPTED_EXTENSION_SET.has( extension ) && !mime_type

}

/**
 * Validates a shared file against the app's v1 constraints.
 * @param {File|Blob|Object} file
 * @returns {{ok: boolean, code?: string, message?: string}}
 */
export const validate_shared_audio_file = ( file ) => {

    if( !file ) return { ok: false, code: `no_audio`, message: SHARE_ERROR_MESSAGES.no_audio }
    if( !is_probable_audio_file( file ) ) return { ok: false, code: `not_audio`, message: SHARE_ERROR_MESSAGES.not_audio }
    if( file.size > MAX_AUDIO_FILE_BYTES ) return { ok: false, code: `too_large`, message: SHARE_ERROR_MESSAGES.too_large }

    return { ok: true }

}

/**
 * Formats a byte count for concise UI labels.
 * @param {number} bytes
 * @returns {string}
 */
export const format_bytes = ( bytes = 0 ) => {

    if( bytes < 1_024 ) return `${ bytes } B`

    const units = [ `KB`, `MB`, `GB` ]
    const value = units.reduce( ( state, unit ) => {
        if( state.done ) return state

        const next_value = state.value / 1_024
        const done = next_value < 1_024 || unit === `GB`

        return { value: next_value, unit, done }
    }, { value: bytes, unit: `B`, done: false } )

    return `${ value.value.toFixed( value.value >= 10 ? 0 : 1 ) } ${ value.unit }`

}
