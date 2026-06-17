const app_cache_patterns = [
    /^workbox-/,
    /^transcribe-gratis-assets-/,
    /^transcribe-gratis-wasm-/
]

export const APP_UPDATE_OFFLINE_MESSAGE = `Connect to the internet before updating the app.`
export const APP_UPDATE_RELOAD_UNAVAILABLE_MESSAGE = `App update reload is unavailable.`

const is_app_update_cache = cache_name => app_cache_patterns.some( pattern => pattern.test( cache_name ) )

const verify_app_update_connection = async ( scope = globalThis ) => {

    if( scope.navigator?.onLine === false ) throw new Error( APP_UPDATE_OFFLINE_MESSAGE )

    // Real installed PWAs have both; non-browser callers fall back to the onLine guard.
    if( !scope.fetch || !scope.location?.origin || scope.location.origin === `null` ) return

    const probe_url = `${ scope.location.origin }/__app_update_probe__?t=${ Date.now() }`

    // Probe a path the service worker does not handle, so offline users keep their current app shell.
    try {
        await scope.fetch( probe_url, { cache: `no-store`, credentials: `same-origin` } )
    } catch {
        throw new Error( APP_UPDATE_OFFLINE_MESSAGE )
    }

}

/**
 * Clears app-shell caches without deleting model or transcript data.
 * @param {Object} scope
 * @returns {Promise<Array<string>>}
 */
export const clear_app_update_caches = async ( scope = globalThis ) => {

    if( !scope.caches?.keys ) return []

    const cache_names = await scope.caches.keys()
    const app_cache_names = cache_names.filter( is_app_update_cache )

    await Promise.all( app_cache_names.map( cache_name => scope.caches.delete( cache_name ) ) )

    return app_cache_names

}

/**
 * Unregisters active service workers and reloads to install the current app.
 * @param {Object} scope
 * @returns {Promise<void>}
 */
export const force_app_update = async ( scope = globalThis ) => {

    const reload = scope.location?.reload

    if( !reload ) throw new Error( APP_UPDATE_RELOAD_UNAVAILABLE_MESSAGE )

    await verify_app_update_connection( scope )

    const registrations = await scope.navigator?.serviceWorker?.getRegistrations?.() || []

    // This is deliberately stronger than the normal SKIP_WAITING update banner.
    await Promise.all( registrations.map( registration => registration.unregister() ) )
    await clear_app_update_caches( scope )

    reload.call( scope.location )

}
