import { beforeEach, describe, expect, it } from 'vitest'
import { clear_content_storage, load_incoming_share, save_incoming_share, save_setting, get_setting, save_transcript } from './app_db.js'

describe( `app storage`, () => {
    beforeEach( async () => {
        indexedDB.deleteDatabase( `transcribe_gratis` )
    } )

    it( `stores shares and transcripts`, async () => {
        await save_incoming_share( {
            share_id: `share-1`,
            name: `voice.ogg`,
            size: 10,
            type: `audio/ogg`,
            file: new Blob( [ `audio` ], { type: `audio/ogg` } )
        } )

        const transcript = await save_transcript( {
            share_id: `share-1`,
            text: `hello`,
            model_id: `test-model`,
            model_backend: `wasm`,
            duration_s: 1
        } )

        const share = await load_incoming_share( `share-1` )

        expect( share.name ).toBe( `voice.ogg` )
        expect( transcript.text ).toBe( `hello` )
    } )

    it( `stores settings and clears content`, async () => {
        await save_setting( `offline_ready`, { ready: true } )
        expect( await get_setting( `offline_ready` ) ).toEqual( { ready: true } )

        await clear_content_storage()

        expect( await get_setting( `offline_ready` ) ).toEqual( { ready: true } )
    } )
} )
