import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import toast from 'react-hot-toast'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { force_app_update } from '../../modules/pwa/force_app_update.js'
import { SettingsPage } from './SettingsPage.jsx'

const initialize_model = vi.hoisted( () => vi.fn() )
const select_profile = vi.hoisted( () => vi.fn( async () => {} ) )
const clear_models = vi.hoisted( () => vi.fn( async () => {} ) )

vi.mock( 'react-hot-toast', () => ( {
    default: {
        dismiss: vi.fn(),
        error: vi.fn(),
        loading: vi.fn( () => `toast-id` ),
        success: vi.fn()
    }
} ) )

vi.mock( '../../modules/pwa/force_app_update.js', () => ( {
    force_app_update: vi.fn()
} ) )

vi.mock( '../../modules/storage/app_db.js', () => ( {
    clear_content_storage: vi.fn( async () => {} ),
    get_setting: vi.fn( async ( _key, fallback ) => fallback ),
    save_setting: vi.fn( async ( _key, value ) => value )
} ) )

vi.mock( '../../stores/model_store.js', () => ( {
    use_model_store: () => ( {
        clear_models,
        initialize: initialize_model,
        profile: { id: `fast` },
        readiness: false,
        select_profile
    } )
} ) )

const render_settings = () => render(
    <MemoryRouter>
        <SettingsPage />
    </MemoryRouter>
)

describe( `SettingsPage`, () => {
    afterEach( () => {
        cleanup()
    } )

    beforeEach( () => {
        vi.clearAllMocks()
        force_app_update.mockResolvedValue()
        toast.loading.mockReturnValue( `toast-id` )
    } )

    it( `dismisses the app update loading toast after a successful command`, async () => {
        const user = userEvent.setup()

        render_settings()

        await user.click( screen.getByRole( `button`, { name: `Update app` } ) )

        expect( force_app_update ).toHaveBeenCalledTimes( 1 )
        expect( toast.dismiss ).toHaveBeenCalledWith( `toast-id` )
    } )

    it( `shows app update failures in the loading toast`, async () => {
        const user = userEvent.setup()
        force_app_update.mockRejectedValueOnce( new Error( `Connect to the internet before updating the app.` ) )

        render_settings()

        const update_button = screen.getByRole( `button`, { name: `Update app` } )

        await user.click( update_button )

        expect( toast.error ).toHaveBeenCalledWith(
            `Connect to the internet before updating the app.`,
            { id: `toast-id` }
        )
        expect( update_button ).toBeEnabled()
    } )
} )
