import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'

const root_dir = process.cwd()
const asset_dir = path.join( root_dir, `public`, `assets` )
const sample_dir = path.join( root_dir, `public`, `samples` )

fs.mkdirSync( asset_dir, { recursive: true } )
fs.mkdirSync( sample_dir, { recursive: true } )

const write_png_icon = ( filename, size, maskable = false ) => {

    const png = new PNG( { width: size, height: size } )
    const center = size / 2
    const radius = maskable ? size * 0.44 : size * 0.42
    const mic_width = size * 0.18

    Array.from( { length: size * size }, ( value, index ) => {
        const x = index % size
        const y = Math.floor( index / size )
        const dx = x - center
        const dy = y - center
        const distance = Math.sqrt( dx * dx + dy * dy )
        const offset = index * 4
        const in_circle = distance < radius
        const in_mic = Math.abs( dx ) < mic_width && y > size * 0.22 && y < size * 0.62
        const in_stem = Math.abs( dx ) < size * 0.035 && y > size * 0.61 && y < size * 0.82
        const in_base = Math.abs( dx ) < size * 0.18 && Math.abs( y - size * 0.82 ) < size * 0.035
        const is_mark = in_mic || in_stem || in_base

        const [ red, green, blue ] = is_mark ? [ 31, 41, 51 ] : in_circle ? [ 250, 251, 252 ] : [ 126, 192, 208 ]

        png.data[ offset ] = red
        png.data[ offset + 1 ] = green
        png.data[ offset + 2 ] = blue
        png.data[ offset + 3 ] = 255
    } )

    fs.writeFileSync( path.join( asset_dir, filename ), PNG.sync.write( png ) )

}

const write_silence_wav = () => {

    const sample_rate = 16_000
    const duration_s = 1
    const sample_count = sample_rate * duration_s
    const byte_rate = sample_rate * 2
    const data_bytes = sample_count * 2
    const buffer = Buffer.alloc( 44 + data_bytes )

    buffer.write( `RIFF`, 0 )
    buffer.writeUInt32LE( 36 + data_bytes, 4 )
    buffer.write( `WAVE`, 8 )
    buffer.write( `fmt `, 12 )
    buffer.writeUInt32LE( 16, 16 )
    buffer.writeUInt16LE( 1, 20 )
    buffer.writeUInt16LE( 1, 22 )
    buffer.writeUInt32LE( sample_rate, 24 )
    buffer.writeUInt32LE( byte_rate, 28 )
    buffer.writeUInt16LE( 2, 32 )
    buffer.writeUInt16LE( 16, 34 )
    buffer.write( `data`, 36 )
    buffer.writeUInt32LE( data_bytes, 40 )

    fs.writeFileSync( path.join( sample_dir, `silence-16k.wav` ), buffer )

}

write_png_icon( `icon-192.png`, 192 )
write_png_icon( `icon-512.png`, 512 )
write_png_icon( `maskable-512.png`, 512, true )
write_silence_wav()
