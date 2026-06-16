import { MAX_DECODED_DURATION_S, SAMPLE_RATE } from '../shared/constants.js'
import { resample_audio_data } from './resample_audio.js'

/**
 * Converts an AudioBuffer to mono audio.
 * @param {AudioBuffer|Object} audio_buffer
 * @returns {Float32Array}
 */
export const mix_audio_buffer_to_mono = audio_buffer => {

    const { length, numberOfChannels } = audio_buffer

    if( numberOfChannels === 1 ) return audio_buffer.getChannelData( 0 ).slice()

    const channel_data = Array.from( { length: numberOfChannels }, ( value, channel_index ) => audio_buffer.getChannelData( channel_index ) )
    const mono_audio = new Float32Array( length )

    mono_audio.forEach( ( value, index ) => {
        mono_audio[ index ] = channel_data.reduce( ( sum, channel ) => sum + channel[ index ], 0 ) / numberOfChannels
    } )

    return mono_audio

}

/**
 * Decodes a browser File into mono 16 kHz PCM.
 * @param {File|Blob} file
 * @param {Object} options
 * @param {Function} options.progress
 * @returns {Promise<{audio: Float32Array, sample_rate: number, duration_s: number}>}
 */
export const prepare_audio_file = async ( file, { progress = () => {} } = {} ) => {

    if( typeof OfflineAudioContext === `undefined` ) throw new Error( `This browser cannot decode audio offline.` )

    progress( { phase: `reading`, percent: 5 } )

    const source_array_buffer = await file.arrayBuffer()
    const decode_context = new OfflineAudioContext( 1, 1, SAMPLE_RATE )

    progress( { phase: `decoding`, percent: 18 } )

    const decoded_buffer = await decode_context.decodeAudioData( source_array_buffer.slice( 0 ) )
    const decoded_sample_rate = decoded_buffer.sampleRate
    const decoded_duration_s = decoded_buffer.duration

    if( decoded_duration_s > MAX_DECODED_DURATION_S ) throw new Error( `Audio is longer than the 30 minute limit.` )

    progress( { phase: `preparing`, percent: 48 } )

    const mono_audio = mix_audio_buffer_to_mono( decoded_buffer )
    const prepared_audio = await resample_audio_data( mono_audio, decoded_sample_rate, SAMPLE_RATE )
    const duration_s = prepared_audio.length / SAMPLE_RATE

    progress( { phase: `prepared`, percent: 100 } )

    return { audio: prepared_audio, sample_rate: SAMPLE_RATE, duration_s }

}
