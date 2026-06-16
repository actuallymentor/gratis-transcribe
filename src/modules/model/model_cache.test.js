import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clear_model_caches, get_selected_model_profile_id } from './model_cache.js'
import { MODEL_PROFILES, SETTING_KEYS } from '../shared/constants.js'
import { get_setting, save_setting } from '../storage/app_db.js'

describe( `model cache helpers`, () => {
    beforeEach( async () => {
        vi.clearAllMocks()
        await save_setting( SETTING_KEYS.selected_model_profile, null )
    } )

    it( `selects the accurate profile when storage and device memory are healthy`, async () => {
        Object.defineProperty( navigator, `deviceMemory`, {
            configurable: true,
            value: 8
        } )

        navigator.storage.estimate.mockResolvedValueOnce( {
            quota: 2_000_000_000,
            usage: 100_000_000
        } )

        const profile_id = await get_selected_model_profile_id()

        expect( profile_id ).toBe( MODEL_PROFILES.accurate.id )
        expect( await get_setting( SETTING_KEYS.selected_model_profile ) ).toBe( MODEL_PROFILES.accurate.id )
    } )

    it( `clears model and wasm runtime caches`, async () => {
        const cache_storage = {
            keys: vi.fn( async () => [
                `transcribe-gratis-models-v1`,
                `transcribe-gratis-wasm-v1`,
                `transcribe-gratis-pages-v1`
            ] ),
            delete: vi.fn( async () => true )
        }

        Object.defineProperty( globalThis, `caches`, {
            configurable: true,
            value: cache_storage
        } )

        Object.defineProperty( window, `caches`, {
            configurable: true,
            value: cache_storage
        } )

        await clear_model_caches()

        expect( cache_storage.delete ).toHaveBeenCalledWith( `transcribe-gratis-models-v1` )
        expect( cache_storage.delete ).toHaveBeenCalledWith( `transcribe-gratis-wasm-v1` )
        expect( cache_storage.delete ).not.toHaveBeenCalledWith( `transcribe-gratis-pages-v1` )
    } )
} )
