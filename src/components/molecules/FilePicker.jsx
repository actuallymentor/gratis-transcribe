import { Upload } from 'lucide-react'
import styled from 'styled-components'
import { Button } from '../atoms/Button.jsx'

const HiddenInput = styled.input`
    height: 1px;
    opacity: 0;
    position: absolute;
    width: 1px;
`

/**
 * Audio file picker.
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function FilePicker( { disabled = false, on_file } ) {

    const choose_file = event => {
        const [ file ] = Array.from( event.target.files || [] )
        event.target.value = ``

        if( file ) on_file( file )
    }

    return <label>
        <HiddenInput
            accept="audio/*,.ogg,.oga,.opus,.mp3,.m4a,.aac,.flac,.amr,.wav,.webm,.3gp"
            disabled={ disabled }
            onChange={ choose_file }
            type="file"
        />
        <Button as="span" icon={ Upload } variant="primary" aria-disabled={ disabled }>Choose audio</Button>
    </label>

}
