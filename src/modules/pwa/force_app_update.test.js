import { describe, expect, it, vi } from 'vitest'
import { CACHE_KEY } from '../shared/constants.js'
import { APP_UPDATE_OFFLINE_MESSAGE, APP_UPDATE_RELOAD_UNAVAILABLE_MESSAGE, clear_app_update_caches, force_app_update } from './force_app_update.js'

const create_scope = () => {

    const deleted_caches = []
    const registrations = [
        { unregister: vi.fn( async () => true ) },
        { unregister: vi.fn( async () => true ) }
    ]

    return {
        deleted_caches,
        location: {
            origin: `https://transcribe.test`,
            reload: vi.fn()
        },
        fetch: vi.fn( async () => ( { ok: true } ) ),
        caches: {
            keys: vi.fn( async () => [
                `workbox-precache-v2-http://127.0.0.1:5173/`,
                `transcribe-gratis-assets-v1`,
                `transcribe-gratis-wasm-v1`,
                `transcribe-gratis-models-v1`,
                CACHE_KEY
            ] ),
            delete: vi.fn( async cache_name => {
                deleted_caches.push( cache_name )

                return true
            } )
        },
        navigator: {
            onLine: true,
            serviceWorker: {
                getRegistrations: vi.fn( async () => registrations )
            }
        },
        registrations
    }

}

describe( `force app update`, () => {
    it( `returns no caches when Cache API is unavailable`, async () => {
        await expect( clear_app_update_caches( {} ) ).resolves.toEqual( [] )
    } )

    it( `clears app-shell caches without deleting model caches`, async () => {
        const scope = create_scope()

        const cleared_caches = await clear_app_update_caches( scope )

        expect( cleared_caches ).toEqual( [
            `workbox-precache-v2-http://127.0.0.1:5173/`,
            `transcribe-gratis-assets-v1`,
            `transcribe-gratis-wasm-v1`
        ] )
        expect( scope.deleted_caches ).toEqual( cleared_caches )
    } )

    it( `unregisters service workers and reloads the app`, async () => {
        const scope = create_scope()

        await force_app_update( scope )

        expect( scope.navigator.serviceWorker.getRegistrations ).toHaveBeenCalledTimes( 1 )
        expect( scope.registrations[ 0 ].unregister ).toHaveBeenCalledTimes( 1 )
        expect( scope.registrations[ 1 ].unregister ).toHaveBeenCalledTimes( 1 )
        expect( scope.fetch ).toHaveBeenCalledWith(
            expect.stringContaining( `/__app_update_probe__` ),
            { cache: `no-store`, credentials: `same-origin` }
        )
        expect( scope.location.reload ).toHaveBeenCalledTimes( 1 )
    } )

    it( `reloads even when service workers are unavailable`, async () => {
        const scope = create_scope()
        delete scope.navigator.serviceWorker

        await force_app_update( scope )

        expect( scope.location.reload ).toHaveBeenCalledTimes( 1 )
    } )

    it( `refuses to delete the offline app shell while offline`, async () => {
        const scope = create_scope()
        scope.navigator.onLine = false

        await expect( force_app_update( scope ) ).rejects.toThrow( APP_UPDATE_OFFLINE_MESSAGE )

        expect( scope.navigator.serviceWorker.getRegistrations ).not.toHaveBeenCalled()
        expect( scope.caches.delete ).not.toHaveBeenCalled()
        expect( scope.location.reload ).not.toHaveBeenCalled()
    } )

    it( `refuses to update when reload is unavailable`, async () => {
        const scope = create_scope()
        delete scope.location.reload

        await expect( force_app_update( scope ) ).rejects.toThrow( APP_UPDATE_RELOAD_UNAVAILABLE_MESSAGE )

        expect( scope.fetch ).not.toHaveBeenCalled()
        expect( scope.caches.delete ).not.toHaveBeenCalled()
    } )
} )
