import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const current_dir = path.dirname( fileURLToPath( import.meta.url ) )
const headers_path = path.resolve( current_dir, `../../public/_headers` )
const speech_fixture_path = path.resolve( current_dir, `../../public/samples/browser-transcription-test.wav` )
const expected_words = [ `hello`, `world`, `browser`, `transcription`, `test` ]
const production_csp = fs.readFileSync( headers_path, `utf8` ).match( /Content-Security-Policy: (.+)/ )?.[ 1 ]

const normalize_text = text => `${ text || `` }`.toLowerCase().replaceAll( /[^a-z0-9]+/g, ` ` ).trim()

const apply_production_csp = async page => {
    await page.route( `http://127.0.0.1:5173/**`, async route => {
        const response = await route.fetch()
        const headers = {
            ...response.headers(),
            'content-security-policy': production_csp
        }

        await route.fulfill( { response, headers } )
    } )
}

test( `loads the real speech model and transcribes real audio`, async ( { page } ) => {
    test.setTimeout( 600_000 )

    expect( production_csp ).toContain( `script-src 'self' 'wasm-unsafe-eval'` )

    await apply_production_csp( page )
    await page.goto( `/` )

    await page.getByRole( `link`, { name: `Settings` } ).click()
    await page.getByRole( `button`, { name: `Whisper Base` } ).click()
    await page.getByRole( `link`, { name: `Back` } ).click()

    const model_panel = page.locator( `section[aria-label="Model status"]` )
    const runtime_support = model_panel.locator( `[aria-label="Runtime support"]` )

    await expect( model_panel.getByText( `Whisper Base` ) ).toBeVisible()
    await expect( runtime_support.getByText( /Runtime supported|Runtime blocked/ ) ).toBeVisible()
    await expect( runtime_support ).toContainText( /WebGPU|WASM/ )
    await expect( runtime_support.getByText( `Runtime blocked` ) ).toHaveCount( 0 )

    await model_panel.getByRole( `button`, { name: `Clear model cache` } ).click()
    await model_panel.getByRole( `button`, { name: `Download speech model` } ).click()

    await expect( model_panel.getByText( `Offline ready` ) ).toBeVisible( { timeout: 420_000 } )

    await page.locator( `input[type="file"]` ).setInputFiles( speech_fixture_path )
    await expect( page.locator( `section[aria-label="Audio processing"]` ) ).toContainText( `browser-transcription-test.wav` )

    await page.getByRole( `button`, { name: `Transcribe` } ).click()

    const transcript_panel = page.locator( `section[aria-label="Transcript"]` )
    let transcript_text = ``

    await expect.poll(
        async () => {
            transcript_text = normalize_text( await transcript_panel.textContent().catch( () => `` ) )

            return transcript_text
        },
        {
            message: `Expected the real model to produce transcript text for the speech fixture.`,
            timeout: 240_000
        }
    ).toMatch( /hello|world|browser|transcription|test/ )

    const matched_word_count = expected_words.filter( word => transcript_text.includes( word ) ).length

    expect( matched_word_count ).toBeGreaterThanOrEqual( 3 )
} )
