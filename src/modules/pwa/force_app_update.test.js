import { describe, expect, it, vi } from 'vitest'
import { clear_app_update_caches, force_app_update } from './force_app_update.js'

const create_scope = () => {

    const deleted_caches = []
    const registrations = [
        { unregister: vi.fn( async () => true ) },
        { unregister: vi.fn( async () => true ) }
    ]

    return {
        deleted_caches,
        location: {
            reload: vi.fn()
        },
        caches: {
            keys: vi.fn( async () => [
                `workbox-precache-v2-http://127.0.0.1:5173/`,
                `transcribe-gratis-assets-v1`,
                `transcribe-gratis-wasm-v1`,
                `transcribe-gratis-models-v1`,
                `transformers-cache`
            ] ),
            delete: vi.fn( async cache_name => {
                deleted_caches.push( cache_name )

                return true
            } )
        },
        navigator: {
            serviceWorker: {
                getRegistrations: vi.fn( async () => registrations )
            }
        },
        registrations
    }

}

describe( `force app update`, () => {
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
        expect( scope.location.reload ).toHaveBeenCalledTimes( 1 )
    } )
} )
