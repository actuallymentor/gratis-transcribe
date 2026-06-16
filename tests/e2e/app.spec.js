import { expect, test } from '@playwright/test'

test( `home page renders the transcription workspace`, async ( { page } ) => {
    await page.goto( `/` )

    await expect( page.getByRole( `heading`, { name: `Transcribe Gratis` } ) ).toBeVisible()
    await expect( page.getByText( `Audio stays on this device.` ) ).toBeVisible()
    await expect( page.getByRole( `button`, { name: `Download speech model` } ).first() ).toBeVisible()
} )
