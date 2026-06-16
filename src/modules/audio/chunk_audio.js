/**
 * Calculates long-audio chunk ranges.
 * @param {Object} options
 * @param {number} options.duration_s
 * @param {number} options.chunk_length_s
 * @param {number} options.stride_length_s
 * @returns {Array<{start_s: number, end_s: number}>}
 */
export const calculate_chunk_ranges = ( { duration_s, chunk_length_s, stride_length_s } ) => {

    if( duration_s <= 0 ) return []

    const step_s = Math.max( 1, chunk_length_s - stride_length_s )
    const chunk_count = Math.ceil( Math.max( 0, duration_s - stride_length_s ) / step_s )

    return Array.from( { length: chunk_count }, ( value, index ) => {
        const start_s = index * step_s
        const end_s = Math.min( duration_s, start_s + chunk_length_s )

        return { start_s, end_s }
    } )

}

/**
 * Merges ASR segment text into a final transcript.
 * @param {Array<{text: string}>} segments
 * @returns {string}
 */
export const merge_transcript_segments = ( segments = [] ) => segments
    .map( ( { text } ) => `${ text || `` }`.trim() )
    .filter( Boolean )
    .join( ` ` )
    .replace( /\s+/g, ` ` )
    .trim()
