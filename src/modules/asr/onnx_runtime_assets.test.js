import { describe, expect, it } from 'vitest'
import { get_onnx_runtime_asset_paths } from './onnx_runtime_assets.js'

describe( `ONNX Runtime assets`, () => {
    it( `uses app-local runtime module and wasm URLs`, () => {
        const { mjs, wasm } = get_onnx_runtime_asset_paths()

        expect( mjs ).toContain( `ort-wasm-simd-threaded.asyncify` )
        expect( mjs ).toMatch( /\.mjs(?:$|\?)/ )
        expect( mjs ).not.toMatch( /^https?:\/\// )

        expect( wasm ).toContain( `ort-wasm-simd-threaded.asyncify` )
        expect( wasm ).toMatch( /\.wasm(?:$|\?)/ )
        expect( wasm ).not.toMatch( /^https?:\/\// )
    } )
} )
