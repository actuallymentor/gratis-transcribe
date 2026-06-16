import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Registers the PWA service worker and exposes update state.
 * @returns {{need_refresh: boolean, update_service_worker: Function}}
 */
export function use_service_worker_update() {

    const {
        needRefresh: [ need_refresh ],
        updateServiceWorker
    } = useRegisterSW( {
        immediate: true
    } )

    return { need_refresh, update_service_worker: updateServiceWorker }

}
