import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'
import { DB_NAME, DB_VERSION, SHARE_STATUS, STORE_INCOMING_SHARES, STORE_SETTINGS, STORE_TRANSCRIPTS } from './modules/shared/constants.js'
import { validate_shared_audio_file } from './modules/share/share_target.js'

precacheAndRoute( self.__WB_MANIFEST )
cleanupOutdatedCaches()

registerRoute(
    ( { request } ) => [ `style`, `script`, `worker`, `font`, `image` ].includes( request.destination ),
    new CacheFirst( {
        cacheName: `transcribe-gratis-assets-v1`,
        plugins: [
            new CacheableResponsePlugin( { statuses: [ 0, 200 ] } ),
            new ExpirationPlugin( { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 365 } )
        ]
    } )
)

registerRoute(
    ( { url } ) => url.pathname.endsWith( `.wasm` ),
    new CacheFirst( {
        cacheName: `transcribe-gratis-wasm-v1`,
        plugins: [
            new CacheableResponsePlugin( { statuses: [ 0, 200 ] } ),
            new ExpirationPlugin( { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 365 } )
        ]
    } )
)

registerRoute(
    ( { url } ) => is_model_asset_url( url ),
    new CacheFirst( {
        cacheName: `transcribe-gratis-models-v1`,
        plugins: [
            new CacheableResponsePlugin( { statuses: [ 0, 200 ] } ),
            new ExpirationPlugin( { maxEntries: 220, maxAgeSeconds: 60 * 60 * 24 * 365 } )
        ]
    } )
)

registerRoute( new NavigationRoute( createHandlerBoundToURL( `/index.html` ) ) )

function is_model_asset_url( url ) {

    if( url.origin === self.location.origin && url.pathname.startsWith( `/models/` ) ) return true
    if( url.hostname === `huggingface.co` ) return true
    if( url.hostname.endsWith( `.huggingface.co` ) ) return true
    if( url.hostname.endsWith( `.hf.co` ) ) return true
    if( url.pathname.includes( `/onnx/` ) ) return true

    return false

}

self.addEventListener( `activate`, event => {
    event.waitUntil( self.clients.claim() )
} )

self.addEventListener( `fetch`, event => {

    const { request } = event
    const url = new URL( request.url )

    if( request.method === `POST` && url.pathname === `/share-target` ) {
        event.respondWith( receive_shared_audio( request ) )
        return
    }

} )

async function receive_shared_audio( request ) {

    const redirect_to = path => Response.redirect( new URL( path, self.location.origin ).href, 303 )

    try {
        const form_data = await request.formData()
        const files = form_data.getAll( `audio` ).filter( value => value instanceof File )
        const [ file ] = files
        const validation = validate_shared_audio_file( file )

        if( !validation.ok ) return redirect_to( `/?share_error=${ validation.code }` )

        const share_id = crypto.randomUUID()

        await save_share_to_indexed_db( {
            share_id,
            file,
            name: file.name || `audio`,
            type: file.type || ``,
            size: file.size,
            title: form_data.get( `title` ) || ``,
            text: form_data.get( `text` ) || ``,
            url: form_data.get( `url` ) || ``,
            received_at: Date.now(),
            status: SHARE_STATUS.received,
            transcript_id: null,
            error: null
        } )

        await notify_clients( { type: `share-received`, share_id } )

        return redirect_to( `/?share_id=${ encodeURIComponent( share_id ) }` )
    } catch {
        return redirect_to( `/?share_error=storage_failed` )
    }

}

const open_service_worker_db = () => new Promise( ( resolve, reject ) => {

    const request = indexedDB.open( DB_NAME, DB_VERSION )

    request.onupgradeneeded = () => {
        const db = request.result

        if( !db.objectStoreNames.contains( STORE_INCOMING_SHARES ) ) db.createObjectStore( STORE_INCOMING_SHARES, { keyPath: `share_id` } )
        if( !db.objectStoreNames.contains( STORE_TRANSCRIPTS ) ) db.createObjectStore( STORE_TRANSCRIPTS, { keyPath: `transcript_id` } )
        if( !db.objectStoreNames.contains( STORE_SETTINGS ) ) db.createObjectStore( STORE_SETTINGS, { keyPath: `key` } )
    }

    request.onsuccess = () => resolve( request.result )
    request.onerror = () => reject( request.error )

} )

async function save_share_to_indexed_db( share ) {

    const db = await open_service_worker_db()

    return new Promise( ( resolve, reject ) => {
        const transaction = db.transaction( STORE_INCOMING_SHARES, `readwrite` )
        const store = transaction.objectStore( STORE_INCOMING_SHARES )
        store.put( share )

        transaction.oncomplete = () => {
            db.close()
            resolve( share )
        }
        transaction.onerror = () => {
            db.close()
            reject( transaction.error )
        }
    } )

}

async function notify_clients( message ) {

    const clients = await self.clients.matchAll( { type: `window`, includeUncontrolled: true } )
    clients.forEach( client => client.postMessage( message ) )

}
