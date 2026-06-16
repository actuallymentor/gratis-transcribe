import { expect, test } from '@playwright/test'

test( `home page renders the transcription workspace`, async ( { page } ) => {
    await page.goto( `/` )

    await expect( page.getByRole( `heading`, { name: `Transcribe Gratis` } ) ).toBeVisible()
    await expect( page.getByText( `Audio stays on this device.` ) ).toBeVisible()
    await expect( page.getByRole( `button`, { name: `Download speech model` } ).first() ).toBeVisible()
} )

test( `shared URL loads from the app shell while offline`, async ( { context, page } ) => {
    await page.goto( `/` )
    await page.waitForFunction( () => navigator.serviceWorker?.ready )
    await page.reload()
    await page.waitForFunction( () => Boolean( navigator.serviceWorker?.controller ) )

    try {
        await context.setOffline( true )
        await page.goto( `/?share_id=offline-share`, { waitUntil: `domcontentloaded` } )

        await expect( page.getByRole( `heading`, { name: `Transcribe Gratis` } ) ).toBeVisible()
        await expect( page.getByText( `Shared audio was not found on this device.` ) ).toBeVisible()
    } finally {
        await context.setOffline( false )
    }
} )
