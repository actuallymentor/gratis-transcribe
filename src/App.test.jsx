import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { QueryParamProvider } from 'use-query-params'
import { WindowHistoryAdapter } from 'use-query-params/adapters/window'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App.jsx'

vi.mock( `virtual:pwa-register/react`, () => ( {
    useRegisterSW: () => ( {
        needRefresh: [ false ],
        updateServiceWorker: vi.fn()
    } )
} ) )

describe( `app shell`, () => {
    it( `renders the utility workspace`, async () => {
        render(
            <BrowserRouter>
                <QueryParamProvider adapter={ WindowHistoryAdapter }>
                    <App />
                </QueryParamProvider>
            </BrowserRouter>
        )

        expect( await screen.findByRole( `heading`, { name: `Transcribe Gratis` } ) ).toBeInTheDocument()
        expect( screen.getByText( `Audio stays on this device.` ) ).toBeInTheDocument()
    } )
} )
