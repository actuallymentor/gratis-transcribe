import ort_wasm_factory_url from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.mjs?url'
import ort_wasm_binary_url from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm?url'

/**
 * Returns app-local ONNX Runtime WASM asset URLs emitted by Vite.
 * @returns {{mjs: string, wasm: string}}
 */
export const get_onnx_runtime_asset_paths = () => ( {
    mjs: ort_wasm_factory_url,
    wasm: ort_wasm_binary_url
} )
