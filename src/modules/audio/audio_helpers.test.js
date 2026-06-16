import { describe, expect, it } from 'vitest'
import { calculate_chunk_ranges, merge_transcript_segments } from './chunk_audio.js'
import { linear_resample } from './resample_audio.js'

describe( `audio helper logic`, () => {
    it( `calculates overlapping chunk windows`, () => {
        expect( calculate_chunk_ranges( { duration_s: 61, chunk_length_s: 30, stride_length_s: 1 } ) ).toEqual( [
            { start_s: 0, end_s: 30 },
            { start_s: 29, end_s: 59 },
            { start_s: 58, end_s: 61 }
        ] )
    } )

    it( `merges transcript segments cleanly`, () => {
        const transcript = merge_transcript_segments( [
            { text: ` hello ` },
            { text: `` },
            { text: ` world` }
        ] )

        expect( transcript ).toBe( `hello world` )
    } )

    it( `resamples mono audio to the target length`, () => {
        const input = new Float32Array( [ 0, 1, 0, -1 ] )
        const output = linear_resample( input, 4, 2 )

        expect( output ).toHaveLength( 2 )
        expect( Array.from( output ) ).toEqual( [ 0, 0 ] )
    } )
} )
