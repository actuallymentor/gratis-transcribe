import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach, vi } from 'vitest'

afterEach( () => {
    vi.restoreAllMocks()
} )

Object.defineProperty( globalThis.navigator, `storage`, {
    configurable: true,
    value: {
        estimate: vi.fn( async () => ( { quota: 2_000_000_000, usage: 10_000_000 } ) ),
        persist: vi.fn( async () => true )
    }
} )

Object.defineProperty( window, `matchMedia`, {
    configurable: true,
    value: vi.fn( query => ( {
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    } ) )
} )
