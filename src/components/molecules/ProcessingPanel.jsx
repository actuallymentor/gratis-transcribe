import { Square } from 'lucide-react'
import styled from 'styled-components'
import { Button } from '../atoms/Button.jsx'
import { ProgressBar } from '../atoms/ProgressBar.jsx'
import { StatusBadge } from '../atoms/StatusBadge.jsx'
import { format_bytes } from '../../modules/share/share_target.js'

const Panel = styled.section`
    border: 1px solid #cbd5df;
    border-radius: 0.5rem;
    display: grid;
    gap: 1rem;
    padding: 1rem;
`

const Details = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
`

/**
 * Shows the current shared audio processing state.
 * @param {Object} props
 * @returns {JSX.Element|null}
 */
export function ProcessingPanel( { error, is_processing, progress, share, on_cancel, on_start } ) {

    if( !share && !error ) return null

    if( !share ) return <Panel aria-label="Audio processing">
        <h2>Shared audio</h2>
        <p role="alert">{ error }</p>
    </Panel>

    return <Panel aria-label="Audio processing">
        <h2>{ is_processing ? progress.label : `Shared audio` }</h2>
        <Details>
            <StatusBadge>{ share.name || `Audio message` }</StatusBadge>
            <StatusBadge>{ share.type || `unknown type` }</StatusBadge>
            <StatusBadge>{ format_bytes( share.size || 0 ) }</StatusBadge>
        </Details>
        { is_processing ? <ProgressBar percent={ progress.percent } /> : null }
        { error ? <p role="alert">{ error }</p> : null }
        { is_processing
            ? <Button icon={ Square } onClick={ on_cancel }>Cancel</Button>
            : <Button variant="primary" onClick={ on_start } disabled={ !share.file }>Transcribe</Button> }
    </Panel>

}
