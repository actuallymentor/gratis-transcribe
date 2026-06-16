/**
 * Resamples mono audio with linear interpolation.
 * @param {Float32Array} input
 * @param {number} from_sample_rate
 * @param {number} to_sample_rate
 * @returns {Float32Array}
 */
export const linear_resample = ( input, from_sample_rate, to_sample_rate ) => {

    if( from_sample_rate === to_sample_rate ) return input
    if( !input.length ) return new Float32Array()

    const ratio = from_sample_rate / to_sample_rate
    const output_length = Math.max( 1, Math.round( input.length / ratio ) )
    const output = new Float32Array( output_length )

    output.forEach( ( value, index ) => {
        const source_index = index * ratio
        const left_index = Math.floor( source_index )
        const right_index = Math.min( input.length - 1, left_index + 1 )
        const weight = source_index - left_index

        output[ index ] = input[ left_index ] * ( 1 - weight ) + input[ right_index ] * weight
    } )

    return output

}

/**
 * Resamples mono audio through OfflineAudioContext when available.
 * @param {Float32Array} input
 * @param {number} from_sample_rate
 * @param {number} to_sample_rate
 * @returns {Promise<Float32Array>}
 */
export const resample_audio_data = async ( input, from_sample_rate, to_sample_rate ) => {

    if( from_sample_rate === to_sample_rate ) return input
    if( typeof OfflineAudioContext === `undefined` ) return linear_resample( input, from_sample_rate, to_sample_rate )

    const output_length = Math.max( 1, Math.ceil( input.length * to_sample_rate / from_sample_rate ) )
    const context = new OfflineAudioContext( 1, output_length, to_sample_rate )
    const buffer = context.createBuffer( 1, input.length, from_sample_rate )
    const source = context.createBufferSource()

    buffer.copyToChannel( input, 0 )
    source.buffer = buffer
    source.connect( context.destination )
    source.start()

    const rendered_buffer = await context.startRendering()

    return rendered_buffer.getChannelData( 0 ).slice()

}
