const app_cache_patterns = [
    /^workbox-/,
    /^precache-/,
    /^transcribe-gratis-assets-/,
    /^transcribe-gratis-wasm-/
]

const is_app_update_cache = cache_name => app_cache_patterns.some( pattern => pattern.test( cache_name ) )

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

    const registrations = await scope.navigator?.serviceWorker?.getRegistrations?.() || []

    await Promise.all( registrations.map( registration => registration.unregister() ) )
    await clear_app_update_caches( scope )

    scope.location?.reload?.()

}
