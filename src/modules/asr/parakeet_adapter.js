/**
 * Creates a placeholder Parakeet adapter boundary.
 * @returns {Object}
 */
export const create_parakeet_adapter = () => ( {
    model_id: `nvidia/parakeet-tdt-0.6b-v3`,
    label: `Parakeet`,

    async load() {
        throw new Error( `Parakeet is not enabled in this browser build yet.` )
    },

    async transcribe() {
        throw new Error( `Parakeet is not enabled in this browser build yet.` )
    },

    async warm() {
        throw new Error( `Parakeet is not enabled in this browser build yet.` )
    },

    async get_cache_status() {
        return { loaded: false, experimental: true }
    }
} )
