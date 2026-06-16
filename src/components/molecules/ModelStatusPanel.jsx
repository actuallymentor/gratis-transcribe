import { Database, Download, Trash2 } from 'lucide-react'
import styled from 'styled-components'
import { Button } from '../atoms/Button.jsx'
import { ProgressBar } from '../atoms/ProgressBar.jsx'
import { StatusBadge } from '../atoms/StatusBadge.jsx'

const Panel = styled.section`
    border: 1px solid #cbd5df;
    border-radius: 0.5rem;
    display: grid;
    gap: 1rem;
    padding: 1rem;
`

const Header = styled.div`
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: space-between;
`

const Actions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
`

/**
 * Model readiness controls.
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function ModelStatusPanel( { backend, error, is_ready, profile, progress, status, on_download, on_clear } ) {

    const badge_label = is_ready ? `Offline ready` : status === `downloading` || status === `warming` ? `Downloading model` : `Model not downloaded`

    return <Panel aria-label="Model status">
        <Header>
            <div>
                <h2>Speech model</h2>
                <p>{ profile.label }{ backend ? ` on ${ backend.toUpperCase() }` : `` }</p>
            </div>
            <StatusBadge tone={ is_ready ? `ready` : `warn` }>{ badge_label }</StatusBadge>
        </Header>

        { status === `downloading` || status === `warming` ? <ProgressBar percent={ progress } /> : null }
        { error ? <p role="alert">{ error }</p> : null }

        <Actions>
            <Button icon={ Download } onClick={ on_download } disabled={ status === `downloading` || status === `warming` }>Download speech model</Button>
            <Button icon={ Trash2 } onClick={ on_clear }>Clear model cache</Button>
            <StatusBadge><Database /> { Math.round( profile.estimated_bytes / 1_024 / 1_024 ) } MB estimate</StatusBadge>
        </Actions>
    </Panel>

}
