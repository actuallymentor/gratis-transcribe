import { describe, expect, it } from 'vitest'
import { get_file_extension, is_probable_audio_file, validate_shared_audio_file } from './share_target.js'

describe( `share target validation`, () => {
    it( `accepts WhatsApp-style generic MIME metadata when the extension is known`, () => {
        const file = { name: `voice.opus`, type: `application/octet-stream`, size: 4_096 }

        expect( is_probable_audio_file( file ) ).toBe( true )
        expect( validate_shared_audio_file( file ) ).toEqual( { ok: true } )
    } )

    it( `keeps manifest and validator FLAC support aligned`, () => {
        const file = { name: `recording.flac`, type: ``, size: 4_096 }

        expect( get_file_extension( file.name ) ).toBe( `.flac` )
        expect( is_probable_audio_file( file ) ).toBe( true )
    } )

    it( `rejects non-audio files before reporting size`, () => {
        const file = { name: `movie.bin`, type: `application/octet-stream`, size: 200 * 1_024 * 1_024 }

        expect( validate_shared_audio_file( file ).code ).toBe( `not_audio` )
    } )

    it( `rejects oversized audio files`, () => {
        const file = { name: `voice.ogg`, type: `audio/ogg`, size: 101 * 1_024 * 1_024 }

        expect( validate_shared_audio_file( file ).code ).toBe( `too_large` )
    } )
} )
